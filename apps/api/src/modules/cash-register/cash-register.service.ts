import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenShiftDto }  from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

interface PaymentBreakdownRow {
  method: string;
  label:  string;
  icon:   string;
  amount: number;
  count:  number;
}

interface PaymentBreakdown {
  cash:          number;
  card:          number;
  transfer:      number;
  mixed:         number;
  total:         number;
  cashTotal:     number;
  cardTotal:     number;
  transferTotal: number;
  cashReal:      number;
  breakdown:     PaymentBreakdownRow[];
}

const METHOD_META: Record<string, { label: string; icon: string }> = {
  cash:     { label: 'Efectivo',       icon: '💵' },
  card:     { label: 'Tarjeta',        icon: '💳' },
  transfer: { label: 'SINPE',          icon: '📱' },
  mixed:    { label: 'Mixto',          icon: '🔀' },
};

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  // ── Abre un turno ─────────────────────────────────────────────────────────
  async openShift(tenantId: string, userId: string, dto: OpenShiftDto) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId, active: true },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    const existing = await this.prisma.cashRegisterShift.findFirst({
      where:   { tenantId, branchId: dto.branchId, status: 'open' },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe una caja abierta en esta sucursal por ${existing.user.firstName} ${existing.user.lastName}` +
        ` desde ${new Date(existing.openedAt).toLocaleTimeString('es-CR')}`,
      );
    }

    return this.prisma.cashRegisterShift.create({
      data: {
        tenantId,
        branchId:      dto.branchId,
        userId,
        openingAmount: dto.openingAmount,
        notes:         dto.notes,
        status:        'open',
      },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    });
  }

  // ── Cierra el turno ───────────────────────────────────────────────────────
  async closeShift(
    tenantId: string,
    userId:   string,
    shiftId:  string,
    dto:      CloseShiftDto,
  ) {
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where: { id: shiftId, tenantId, status: 'open' },
    });
    if (!shift) throw new NotFoundException('Turno no encontrado o ya cerrado');

    // Resumen de ventas del turno
    const salesAgg = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        ...(shift.branchId ? { branchId: shift.branchId } : {}),
        createdAt: { gte: shift.openedAt },
      },
      _sum:   { total: true },
      _count: { id: true },
    });

    const totalSales  = Number(salesAgg._sum.total ?? 0);
    const totalOrders = salesAgg._count.id;

    // Desglose por método de pago
    const breakdown = await this._getPaymentBreakdown(
      tenantId,
      shift.branchId ?? undefined,
      shift.openedAt,
    );

    // Efectivo esperado = apertura + todo el efectivo (puro + parte de mixtos)
    const expectedAmount = Number(shift.openingAmount) + breakdown.cashReal;
    const difference     = dto.closingAmount - expectedAmount;

    return this.prisma.cashRegisterShift.update({
      where: { id: shiftId },
      data: {
        closingAmount:  dto.closingAmount,
        expectedAmount,
        difference,
        totalSales,
        totalOrders,
        notes:    dto.notes ?? shift.notes,
        status:   'closed',
        closedAt: new Date(),
        userId,
      },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    });
  }

  // ── Turno activo con desglose en tiempo real ──────────────────────────────
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

    const paymentBreakdown = await this._getPaymentBreakdown(
      tenantId,
      branchId,
      shift.openedAt,
    );

    return { ...shift, paymentBreakdown };
  }

  // ── Valida caja abierta (usado por SalesService) ──────────────────────────
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
  async findAll(
    tenantId: string,
    filters?: {
      branchId?:  string;
      startDate?: string;
      endDate?:   string;
      page?:      number;
      limit?:     number;
    },
  ) {
    const page  = filters?.page  ?? 1;
    const limit = filters?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where = {
      tenantId,
      ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      ...(filters?.startDate || filters?.endDate ? {
        openedAt: {
          ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
          ...(filters.endDate   ? { lte: new Date(filters.endDate)   } : {}),
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

  // ── Detalle de un turno con desglose ─────────────────────────────────────
  async findOne(tenantId: string, shiftId: string) {
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where:   { id: shiftId, tenantId },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    });
    if (!shift) throw new NotFoundException('Turno no encontrado');

    const paymentBreakdown = await this._getPaymentBreakdown(
      tenantId,
      shift.branchId ?? undefined,
      shift.openedAt,
      shift.closedAt ?? undefined,
    );

    return { ...shift, paymentBreakdown };
  }

  // ── Desglose por método de pago ───────────────────────────────────────────
  private async _getPaymentBreakdown(
    tenantId: string,
    branchId: string | undefined,
    from:     Date,
    to?:      Date,
  ): Promise<PaymentBreakdown> {

    const dateFilter = {
      gte: from,
      ...(to ? { lte: to } : {}),
    };

    const baseWhere = {
      tenantId,
      ...(branchId ? { branchId } : {}),
      createdAt: dateFilter,
    };

    // 1. Agrupación por método de pago
    const grouped = await this.prisma.sale.groupBy({
      by:     ['paymentMethod'],
      where:  baseWhere,
      _sum:   { total: true },
      _count: { id: true },
    });

    // 2. Ventas mixtas — extrae desglose del campo JSON
    const mixedSales = await this.prisma.sale.findMany({
      where:  { ...baseWhere, paymentMethod: 'mixed' },
      select: { mixedPayments: true, total: true },
    });

    let mixedCash     = 0;
    let mixedCard     = 0;
    let mixedTransfer = 0;

    for (const s of mixedSales) {
      const mp = s.mixedPayments as Record<string, number> | null;
      if (mp) {
        mixedCash     += Number(mp.cash     ?? 0);
        mixedCard     += Number(mp.card     ?? 0);
        mixedTransfer += Number(mp.transfer ?? 0);
      }
    }

    // 3. Construye resultado base
    const base: Record<string, number> = {
      cash:     0,
      card:     0,
      transfer: 0,
      mixed:    0,
    };
    let grandTotal = 0;

    const breakdownRows: PaymentBreakdownRow[] = [];

    for (const row of grouped) {
      const method = row.paymentMethod as string;
      const amount = Number(row._sum.total ?? 0);
      const count  = row._count.id;

      base[method]  = amount;
      grandTotal   += amount;

      breakdownRows.push({
        method,
        label:  METHOD_META[method]?.label ?? method,
        icon:   METHOD_META[method]?.icon  ?? '💰',
        amount,
        count,
      });
    }

    // Ordena: efectivo → tarjeta → sinpe → mixto
    const ORDER = ['cash', 'card', 'transfer', 'mixed'];
    breakdownRows.sort((a, b) => {
      const ia = ORDER.indexOf(a.method);
      const ib = ORDER.indexOf(b.method);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    // 4. Totales reales distribuyendo mixtos
    const cashTotal     = base.cash     + mixedCash;
    const cardTotal     = base.card     + mixedCard;
    const transferTotal = base.transfer + mixedTransfer;
    const cashReal      = cashTotal; // efectivo físico esperado en caja

    return {
      cash:          base.cash,
      card:          base.card,
      transfer:      base.transfer,
      mixed:         base.mixed,
      total:         grandTotal,
      cashTotal,
      cardTotal,
      transferTotal,
      cashReal,
      breakdown:     breakdownRows,
    };
  }
}
