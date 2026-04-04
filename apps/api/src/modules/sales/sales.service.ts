import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

interface SaleItemInput {
  productId: string;
  quantity: number;
  discount?: number;
}

interface CreateSaleInput {
  branchId: string;
  items: SaleItemInput[];
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'mixed';
  discount?: number;
  notes?: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'Transferencia',
  mixed:    'Mixto',
};

const LOW_STOCK_THRESHOLD = 5;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency', currency: 'CRC', maximumFractionDigits: 0,
  }).format(amount);
}

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(tenantId: string, userId: string, input: CreateSaleInput) {
    const { branchId, items, paymentMethod = 'cash', discount = 0, notes } = input;

    // Verifica que la sucursal pertenece al tenant
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, active: true },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    // Procesa cada item y verifica stock
    const saleItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.prisma.product.findFirst({
          where: { id: item.productId, tenantId, active: true },
        });
        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);

        const inventory = await this.prisma.inventory.findUnique({
          where: { productId_branchId: { productId: item.productId, branchId } },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${product.name}`);
        }

        const unitPrice   = Number(product.price);
        const itemDiscount = item.discount ?? 0;
        const subtotal    = (unitPrice * item.quantity) - itemDiscount;

        return { product, inventory, item, unitPrice, itemDiscount, subtotal };
      }),
    );

    // Calcula totales
    const subtotal = saleItems.reduce((acc, s) => acc + s.subtotal, 0);
    const total    = subtotal - discount;

    // Crea la venta en una transacción
    const sale = await this.prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          tenantId, branchId, userId,
          subtotal, discount, total,
          paymentMethod, notes,
          items: {
            create: saleItems.map(s => ({
              productId: s.item.productId,
              quantity:  s.item.quantity,
              unitPrice: s.unitPrice,
              discount:  s.itemDiscount,
              subtotal:  s.subtotal,
            })),
          },
        },
        include: {
          items:  { include: { product: true } },
          branch: true,
          user:   true,
        },
      });

      // Descuenta el stock
      for (const s of saleItems) {
        await tx.inventory.update({
          where: { productId_branchId: { productId: s.item.productId, branchId } },
          data:  { quantity: { decrement: s.item.quantity } },
        });

        await tx.movement.create({
          data: {
            inventoryId: s.inventory.id,
            type:        'out',
            quantity:    s.item.quantity,
            reason:      `Venta #${newSale.id}`,
          },
        });
      }

      return newSale;
    });

    // ── Notificación: nueva venta ──────────────────────
    const itemCount  = items.reduce((acc, i) => acc + i.quantity, 0);
    const methodLabel = PAYMENT_LABELS[paymentMethod] ?? paymentMethod;

    this.notificationsGateway.pushToTenant(tenantId, {
      type:    'new_sale',
      title:   'Nueva venta registrada',
      message: `${formatCurrency(total)} · ${itemCount} item${itemCount !== 1 ? 's' : ''} · ${methodLabel} · ${branch.name}`,
      color:   '#3DBF7F',
      link:    `/sales`,
    }).catch(() => {}); // silencioso — no rompe la venta

    // ── Notificación: stock bajo post-venta ───────────
    for (const s of saleItems) {
      const updatedInventory = await this.prisma.inventory.findUnique({
        where: { productId_branchId: { productId: s.item.productId, branchId } },
      });

      if (
        updatedInventory &&
        updatedInventory.quantity <= LOW_STOCK_THRESHOLD &&
        updatedInventory.quantity >= 0
      ) {
        this.notificationsGateway.pushToTenant(tenantId, {
          type:    'low_stock',
          title:   'Stock bajo',
          message: `${s.product.name} tiene solo ${updatedInventory.quantity} unidad${updatedInventory.quantity !== 1 ? 'es' : ''} en ${branch.name}`,
          color:   '#F0A030',
          link:    `/inventory`,
        }).catch(() => {});
      }
    }

    // ── Notificación: meta diaria (cada 10 ventas) ────
    const salesToday = await this.prisma.sale.count({
      where: {
        tenantId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    if (salesToday > 0 && salesToday % 10 === 0) {
      this.notificationsGateway.pushToTenant(tenantId, {
        type:    'daily_goal',
        title:   `¡${salesToday} ventas hoy! 🎯`,
        message: `Tu equipo ha completado ${salesToday} transacciones en el día. ¡Sigan así!`,
        color:   '#A78BFA',
        link:    `/analytics`,
      }).catch(() => {});
    }

    return sale;
  }

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
        createdAt: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate   && { lte: new Date(filters.endDate)   }),
        },
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          items:  { include: { product: true } },
          branch: true,
          user:   { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(tenantId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: {
        items:  { include: { product: true } },
        branch: true,
        user:   { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  async getSummary(tenantId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const where = {
      tenantId,
      createdAt: { gte: today },
      ...(branchId && { branchId }),
    };

    const whereYesterday = {
      tenantId,
      createdAt: { gte: yesterday, lt: today },
      ...(branchId && { branchId }),
    };

    const [sales, aggregate, salesYesterday, aggregateYesterday] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.aggregate({ where, _sum: { total: true } }),
      this.prisma.sale.count({ where: whereYesterday }),
      this.prisma.sale.aggregate({ where: whereYesterday, _sum: { total: true } }),
    ]);

    return {
      salesToday:       sales,
      revenueToday:     aggregate._sum.total         ?? 0,
      salesYesterday:   salesYesterday,
      revenueYesterday: aggregateYesterday._sum.total ?? 0,
    };
  }
}