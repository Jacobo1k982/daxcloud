import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenShiftDto }  from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  // ── Abre un turno de caja ─────────────────────────────────────────────────
  async openShift(tenantId: string, userId: string, dto: OpenShiftDto) {
    const { branchId, openingAmount, notes } = dto;

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, active: true },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

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
      data: { tenantId, branchId, userId, openingAmount, notes, status: 'open' },
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

    // ── Totales generales del turno ────────────────────────────────────────
    const salesAgg = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        branchId:  shift.branchId ?? undefined,
        createdAt: { gte: shift.openedAt },
      },
      _sum:   { total: true },
      _count: { id: true },
    });

    const totalSales  = Number(salesAgg._sum.total ?? 0);
    const totalOrders = salesAgg._count.id;

    // ── Desglose por método de pago ────────────────────────────────────────
    const paymentBreakdown = await this._getPaymentBreakdown(
      tenantId,
      shift.branchId ?? undefined,
      shift.openedAt,
    );

    // Monto esperado = apertura + ventas en efectivo (incluyendo parte cash de mixtos)
    const expectedAmount = Number(shift.openingAmount) + paymentBreakdown.cash;
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
        userId,
      },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    });
  }

  // ── Estado actual de caja ─────────────────────────────────────────────────
  async getActiveShift(tenantId: string, branchId: string) {
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where:   { tenantId, branchId, status: 'open' },
      include: {
        user:   { select: { firstName: true, lastName: true, avatarUrl: true } },
        branch: { select: { name: true } },
      },
      orderBy: { openedAt: 'desc' },
    });

    if (!shift) return null;

    // Agrega el desglose en tiempo real al turno activo
    const paymentBreakdown = await this._getPaymentBreakdown(
      tenantId,
      branchId,
      shift.openedAt,
    );

    return { ...shift, paymentBreakdown };
  }

  // ── Valida que haya caja abierta ──────────────────────────────────────────
  async assertShiftOpen(tenantId: string, branchId: string): Promise<void> {
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where: { tenantId, branchId, status: 'open' },
    });
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

    const closedAt = shift.closedAt ?? undefined;

    const paymentBreakdown = await this._getPaymentBreakdown(
      tenantId,
      shift.branchId ?? undefined,
      shift.openedAt,
      closedAt,
    );

    return { ...shift, paymentBreakdown };
  }

  // ── Helper: desglose por método de pago ──────────────────────────────────
  private async _getPaymentBreakdown(
    tenantId:  string,
    branchId:  string | undefined,
    from:      Date,
    to?:       Date,
  ) {
    const dateFilter = {
      gte: from,
      ...(to ? { lte: to } : {}),
    };

    const where = {
      tenantId,
      ...(branchId ? { branchId } : {}),
      createdAt: dateFilter,
    };

    // Agrupa ventas por método de pago
    const byMethod = await this.prisma.sale.groupBy({
      by:    ['paymentMethod'],
      where,
      _sum:  { total: true },
      _count: { id: true },
    });

    // Ventas mixtas — necesitamos sumar el desglose del campo JSON
    const mixedSales = await this.prisma.sale.findMany({
      where: { ...where, paymentMethod: 'mixed' },
      select: { mixedPayments: true, total: true },
    });

    // Suma del efectivo proveniente de ventas mixtas
    let mixedCash     = 0;
    let mixedCard     = 0;
    let mixedTransfer = 0;

    for (const s of mixedSales) {
      const mp = s.mixedPayments as any;
      if (mp) {
        mixedCash     += Number(mp.cash     ?? 0);
        mixedCard     += Number(mp.card     ?? 0);
        mixedTransfer += Number(mp.transfer ?? 0);
      }
    }

    // Construye el resultado
    const result = {
      cash:     0,
      card:     0,
      transfer: 0,
      mixed:    0,
      total:    0,
      // Efectivo real (método puro + parte efectivo de mixtos)
      cashReal: 0,
      // Desglose con mixtos distribuidos
      cashTotal:     0,
      cardTotal:     0,
      transferTotal: 0,
      breakdown: [] as { method: string; label: string; amount: number; count: number; icon: string }[],
    };

    const LABELS: Record<string, { label: string; icon: string }> = {
      cash:     { label: 'Efectivo',       icon: '💵' },
      card:     { label: 'Tarjeta',        icon: '💳' },
      transfer: { label: 'SINPE',          icon: '📱' },
      mixed:    { label: 'Mixto',          icon: '🔀' },
    };

    for (const row of byMethod) {
      const amount = Number(row._sum.total ?? 0);
      const count  = row._count.id;
      const method = row.paymentMethod;

      result[method as keyof typeof result] = amount as any;
      result.total += amount;

      result.breakdown.push({
        method,
        label:  LABELS[method]?.label ?? method,
        icon:   LABELS[method]?.icon  ?? '💰',
        amount,
        count,
      });
    }

    // Totales reales distribuyendo los mixtos
    result.cashTotal     = result.cash     + mixedCash;
    result.cardTotal     = result.card     + mixedCard;
    result.transferTotal = result.transfer + mixedTransfer;
    result.cashReal      = result.cashTotal; // efectivo total (para cuadre de caja)

    return result;
  }
}
