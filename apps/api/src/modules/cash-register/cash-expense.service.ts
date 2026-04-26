import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const EXPENSE_CATEGORIES = [
  { value: 'compra_proveedor', label: 'Compra a proveedor' },
  { value: 'servicios',        label: 'Servicios' },
  { value: 'transporte',       label: 'Transporte' },
  { value: 'limpieza',         label: 'Limpieza y aseo' },
  { value: 'papeleria',        label: 'PapelerÃ­a' },
  { value: 'alimentacion',     label: 'AlimentaciÃ³n' },
  { value: 'mantenimiento',    label: 'Mantenimiento' },
  { value: 'varios',           label: 'Varios' },
];

@Injectable()
export class CashExpenseService {
  constructor(private prisma: PrismaService) {}

  // â”€â”€ Registrar gasto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async create(tenantId: string, userId: string, data: {
    branchId:    string;
    amount:      number;
    concept:     string;
    category:    string;
    supplier?:   string;
    notes?:      string;
    managerPin?: string;
  }) {
    // Verificar caja abierta
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where: { tenantId, branchId: data.branchId, status: 'open' },
    });
    if (!shift) throw new BadRequestException('No hay caja abierta en esta sucursal');

    // Verificar PIN del gerente si se provee
    if (data.managerPin) {
      const manager = await this.prisma.user.findFirst({
        where: { tenantId, posPin: data.managerPin, active: true },
      });
      if (!manager) throw new ForbiddenException('PIN de autorizaciÃ³n incorrecto');

      return this.prisma.cashExpense.create({
        data: {
          tenantId,
          branchId:     data.branchId,
          shiftId:      shift.id,
          userId,
          amount:       data.amount,
          concept:      data.concept,
          category:     data.category,
          supplier:     data.supplier,
          notes:        data.notes,
          authorized:   true,
          authorizedBy: manager.id,
        },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
    }

    // Sin PIN â€” solo cajero
    return this.prisma.cashExpense.create({
      data: {
        tenantId,
        branchId:  data.branchId,
        shiftId:   shift.id,
        userId,
        amount:    data.amount,
        concept:   data.concept,
        category:  data.category,
        supplier:  data.supplier,
        notes:     data.notes,
        authorized: false,
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  // â”€â”€ Listar gastos del turno activo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async findByShift(tenantId: string, branchId: string) {
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where: { tenantId, branchId, status: 'open' },
    });
    if (!shift) return { expenses: [], total: 0, shift: null };

    const expenses = await this.prisma.cashExpense.findMany({
      where:   { tenantId, shiftId: shift.id },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const total = expenses.reduce((a, e) => a + Number(e.amount), 0);

    // Saldo actual = apertura + ventas efectivo - gastos
    const salesAgg = await this.prisma.sale.aggregate({
      where:   { tenantId, branchId, createdAt: { gte: shift.openedAt } },
      _sum:    { total: true },
    });

    // Ventas en efectivo
    const cashSales = await this.prisma.sale.aggregate({
      where:   { tenantId, branchId, paymentMethod: 'cash', createdAt: { gte: shift.openedAt } },
      _sum:    { total: true },
    });
    const mixedSales = await this.prisma.sale.findMany({
      where:   { tenantId, branchId, paymentMethod: 'mixed', createdAt: { gte: shift.openedAt } },
      select:  { mixedPayments: true },
    });
    const mixedCash = mixedSales.reduce((a, s) => {
      const mp = s.mixedPayments as Record<string, number> | null;
      return a + Number(mp?.cash ?? 0);
    }, 0);

    const cashIn     = Number(cashSales._sum.total ?? 0) + mixedCash;
    const currentBalance = Number(shift.openingAmount) + cashIn - total;

    return {
      shift,
      expenses,
      totalExpenses: total,
      cashIn,
      currentBalance,
      openingAmount: Number(shift.openingAmount),
    };
  }

  // â”€â”€ Eliminar gasto (solo si no estÃ¡ autorizado) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async remove(tenantId: string, expenseId: string, userId: string) {
    const expense = await this.prisma.cashExpense.findFirst({
      where: { id: expenseId, tenantId },
    });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    if (expense.authorized) throw new ForbiddenException('No se puede eliminar un gasto autorizado');

    return this.prisma.cashExpense.delete({ where: { id: expenseId } });
  }

  // â”€â”€ CategorÃ­as disponibles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  getCategories() {
    return EXPENSE_CATEGORIES;
  }
}
