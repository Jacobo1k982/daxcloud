import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  // ── Abre un turno de caja ─────────────────────────────────────────────────
  async openShift(tenantId: string, userId: string, dto: OpenShiftDto) {
    const { branchId, openingAmount, notes } = dto;

    // Verifica que la sucursal pertenezca al tenant
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, active: true },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    // Solo puede haber un turno abierto por sucursal a la vez
    const existing = await this.prisma.cashRegisterShift.findFirst({
      where: { tenantId, branchId, status: 'open' },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una caja abierta en esta sucursal por ${existing.user.firstName} ${existing.user.lastName} desde ${existing.openedAt.toLocaleTimeString('es-CR')}`,
      );
    }

    return this.prisma.cashRegisterShift.create({
      data: {
        tenantId,
        branchId,
        userId,
        openingAmount,
        notes,
        status: 'open',
      },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    });
  }

  // ── Cierra el turno activo ────────────────────────────────────────────────
  async closeShift(tenantId: string, userId: string, shiftId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where: { id: shiftId, tenantId, status: 'open' },
    });
    if (!shift) throw new NotFoundException('Turno no encontrado o ya cerrado');

    // Suma las ventas realizadas durante este turno
    const salesAgg = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        branchId: shift.branchId ?? undefined,
        createdAt: { gte: shift.openedAt },
      },
      _sum:   { total: true },
      _count: { id: true },
    });

    const totalSales  = Number(salesAgg._sum.total ?? 0);
    const totalOrders = salesAgg._count.id;

    // Monto esperado = apertura + ventas en efectivo
    const cashSalesAgg = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        branchId:      shift.branchId ?? undefined,
        paymentMethod: 'cash',
        createdAt:     { gte: shift.openedAt },
      },
      _sum: { total: true },
    });

    const cashSales      = Number(cashSalesAgg._sum.total ?? 0);
    const expectedAmount = Number(shift.openingAmount) + cashSales;
    const difference     = dto.closingAmount - expectedAmount;

    return this.prisma.cashRegisterShift.update({
      where: { id: shiftId },
      data: {
        closingAmount:  dto.closingAmount,
        expectedAmount,
        difference,
        totalSales,
        totalOrders,
        notes:          dto.notes ?? shift.notes,
        status:         'closed',
        closedAt:       new Date(),
        userId,          // quien cierra
      },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    });
  }

  // ── Estado actual de caja (para el POS) ──────────────────────────────────
  async getActiveShift(tenantId: string, branchId: string) {
    return this.prisma.cashRegisterShift.findFirst({
      where:   { tenantId, branchId, status: 'open' },
      include: {
        user:   { select: { firstName: true, lastName: true, avatarUrl: true } },
        branch: { select: { name: true } },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  // ── Valida que haya caja abierta (usado por SalesService) ─────────────────
  async assertShiftOpen(tenantId: string, branchId: string): Promise<void> {
    const shift = await this.getActiveShift(tenantId, branchId);
    if (!shift) {
      throw new BadRequestException(
        'No hay una apertura de caja activa. Abre la caja antes de registrar ventas.',
      );
    }
  }

  // ── Historial de turnos ───────────────────────────────────────────────────
  async findAll(tenantId: string, filters?: {
    branchId?:  string;
    startDate?: string;
    endDate?:   string;
    page?:      number;
    limit?:     number;
  }) {
    const page  = filters?.page  ?? 1;
    const limit = filters?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where = {
      tenantId,
      ...(filters?.branchId && { branchId: filters.branchId }),
      ...(filters?.startDate || filters?.endDate ? {
        openedAt: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate   && { lte: new Date(filters.endDate)   }),
        },
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.cashRegisterShift.findMany({
        where,
        include: {
          user:   { select: { firstName: true, lastName: true } },
          branch: { select: { name: true } },
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.cashRegisterShift.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ── Detalle de un turno ───────────────────────────────────────────────────
  async findOne(tenantId: string, shiftId: string) {
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where:   { id: shiftId, tenantId },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    });
    if (!shift) throw new NotFoundException('Turno no encontrado');

    // Ventas del turno desglosadas por método de pago
    const sales = await this.prisma.sale.groupBy({
      by:     ['paymentMethod'],
      where:  {
        tenantId,
        branchId:  shift.branchId ?? undefined,
        createdAt: { gte: shift.openedAt, ...(shift.closedAt ? { lte: shift.closedAt } : {}) },
      },
      _sum:   { total: true },
      _count: { id: true },
    });

    return { ...shift, salesBreakdown: sales };
  }
}
