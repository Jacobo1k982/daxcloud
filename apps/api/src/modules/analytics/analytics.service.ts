import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: string, customStart?: string, customEnd?: string) {
    if (period === 'custom' && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd) };
    }
    const now = new Date();
    const start = new Date();
    switch (period) {
      case 'today':   start.setHours(0, 0, 0, 0); break;
      case 'week':    start.setDate(now.getDate() - 7); break;
      case 'month':   start.setDate(1); start.setHours(0, 0, 0, 0); break;
      case 'quarter': start.setMonth(now.getMonth() - 3); break;
      case 'year':    start.setMonth(0, 1); start.setHours(0, 0, 0, 0); break;
      default:        start.setDate(1); start.setHours(0, 0, 0, 0);
    }
    return { start, end: now };
  }

  async getSummary(tenantId: string, period: string, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);
    const diff      = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - diff);
    const prevEnd   = new Date(start);

    const [current, previous, totalProducts, totalInventoryValue] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' },
        _sum: { total: true, discount: true }, _count: { id: true }, _avg: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: prevStart, lte: prevEnd }, status: 'completed' },
        _sum: { total: true }, _count: { id: true },
      }),
      this.prisma.product.count({ where: { tenantId, active: true } }),
      this.prisma.inventory.aggregate({
        where: { branch: { tenantId } }, _sum: { quantity: true },
      }),
    ]);

    const revenue      = Number(current._sum.total    ?? 0);
    const prevRevenue  = Number(previous._sum.total   ?? 0);
    const salesCount   = current._count.id;
    const prevSalesCount = previous._count.id;

    return {
      revenue,
      revenueChange:   prevRevenue    > 0 ? Math.round(((revenue    - prevRevenue)    / prevRevenue)    * 1000) / 10 : 0,
      salesCount,
      salesChange:     prevSalesCount > 0 ? Math.round(((salesCount - prevSalesCount) / prevSalesCount) * 1000) / 10 : 0,
      avgTicket:       Math.round(Number(current._avg.total    ?? 0) * 100) / 100,
      totalDiscount:   Math.round(Number(current._sum.discount ?? 0) * 100) / 100,
      totalProducts,
      totalInventoryUnits: totalInventoryValue._sum.quantity ?? 0,
    };
  }

  async getSalesByPeriod(tenantId: string, period: string, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);

    const sales = await this.prisma.sale.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' },
      select: { total: true, createdAt: true, discount: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, { date: string; revenue: number; count: number; discount: number }> = {};
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = { date, revenue: 0, count: 0, discount: 0 };
      grouped[date].revenue  += Number(sale.total);
      grouped[date].count    += 1;
      grouped[date].discount += Number(sale.discount ?? 0);
    });

    return Object.values(grouped).map(d => ({
      ...d,
      revenue:  Math.round(d.revenue  * 100) / 100,
      discount: Math.round(d.discount * 100) / 100,
    }));
  }

  async getTopProducts(tenantId: string, period: string, limit = 10, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);

    const items = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' } },
      _sum: { quantity: true, subtotal: true },
      _count: { id: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: limit,
    });

    return Promise.all(items.map(async item => {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, category: true, sku: true },
      });
      return {
        productId:    item.productId,
        name:         product?.name     ?? 'Producto eliminado',
        category:     product?.category ?? '-',
        sku:          product?.sku      ?? '-',
        quantity:     item._sum.quantity ?? 0,
        revenue:      Math.round(Number(item._sum.subtotal ?? 0) * 100) / 100,
        transactions: item._count.id,
      };
    }));
  }

  async getSalesByCategory(tenantId: string, period: string, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);

    const items = await this.prisma.saleItem.findMany({
      where: { sale: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' } },
      include: { product: { select: { category: true } } },
    });

    const grouped: Record<string, { category: string; revenue: number; quantity: number }> = {};
    items.forEach(item => {
      const cat = item.product?.category ?? 'Sin categoría';
      if (!grouped[cat]) grouped[cat] = { category: cat, revenue: 0, quantity: 0 };
      grouped[cat].revenue  += Number(item.subtotal ?? 0);
      grouped[cat].quantity += item.quantity;
    });

    const total = Object.values(grouped).reduce((s, c) => s + c.revenue, 0);
    return Object.values(grouped)
      .sort((a, b) => b.revenue - a.revenue)
      .map(c => ({
        ...c,
        revenue:    Math.round(c.revenue * 100) / 100,
        percentage: total > 0 ? Math.round((c.revenue / total) * 1000) / 10 : 0,
      }));
  }

  async getBranchPerformance(tenantId: string, period: string, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);
    const branches = await this.prisma.branch.findMany({ where: { tenantId, active: true } });

    const performance = await Promise.all(branches.map(async branch => {
      const stats = await this.prisma.sale.aggregate({
        where: { branchId: branch.id, createdAt: { gte: start, lte: end }, status: 'completed' },
        _sum: { total: true }, _count: { id: true }, _avg: { total: true },
      });
      return {
        branchId:   branch.id,
        name:       branch.name,
        revenue:    Math.round(Number(stats._sum.total ?? 0) * 100) / 100,
        salesCount: stats._count.id,
        avgTicket:  Math.round(Number(stats._avg.total ?? 0) * 100) / 100,
      };
    }));

    const totalRevenue = performance.reduce((acc, b) => acc + b.revenue, 0);
    return performance.map(b => ({
      ...b,
      percentage: totalRevenue > 0 ? Math.round((b.revenue / totalRevenue) * 1000) / 10 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  async getPaymentMethods(tenantId: string, period: string, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);
    const methods = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' },
      _sum: { total: true }, _count: { id: true },
    });

    const total = methods.reduce((acc, m) => acc + m._count.id, 0);
    const labels: Record<string, string> = {
      cash: 'Efectivo', card: 'Tarjeta', transfer: 'SINPE/Transferencia', mixed: 'Mixto',
    };

    return methods.map(m => ({
      method:     m.paymentMethod,
      label:      labels[m.paymentMethod] ?? m.paymentMethod,
      revenue:    Math.round(Number(m._sum.total ?? 0) * 100) / 100,
      count:      m._count.id,
      percentage: total > 0 ? Math.round((m._count.id / total) * 1000) / 10 : 0,
    })).sort((a, b) => b.count - a.count);
  }

  async getPeakHours(tenantId: string, period: string, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);
    const sales = await this.prisma.sale.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' },
      select: { createdAt: true, total: true },
    });

    const hours: Record<number, { hour: number; count: number; revenue: number }> = {};
    for (let i = 0; i < 24; i++) hours[i] = { hour: i, count: 0, revenue: 0 };

    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      hours[hour].count   += 1;
      hours[hour].revenue += Number(sale.total);
    });

    return Object.values(hours).map(h => ({
      ...h,
      revenue: Math.round(h.revenue * 100) / 100,
      label:   `${h.hour.toString().padStart(2, '0')}:00`,
    }));
  }

  async getTopCashiers(tenantId: string, period: string, limit = 8, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);
    const cashiers = await this.prisma.sale.groupBy({
      by: ['userId'],
      where: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' },
      _sum: { total: true }, _count: { id: true }, _avg: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    return Promise.all(cashiers.map(async c => {
      const user = await this.prisma.user.findUnique({
        where: { id: c.userId },
        select: { firstName: true, lastName: true, role: true, avatarUrl: true },
      });
      return {
        userId:     c.userId,
        name:       user ? `${user.firstName} ${user.lastName}` : 'Usuario eliminado',
        role:       user?.role ?? '-',
        avatarUrl:  user?.avatarUrl,
        revenue:    Math.round(Number(c._sum.total ?? 0) * 100) / 100,
        salesCount: c._count.id,
        avgTicket:  Math.round(Number(c._avg.total ?? 0) * 100) / 100,
      };
    }));
  }

  async getCriticalStock(tenantId: string) {
    const allInventory = await this.prisma.inventory.findMany({
      where:   { branch: { tenantId } },
      include: {
        product: { select: { name: true, sku: true, category: true } },
        branch:  { select: { name: true } },
      },
    });

    return allInventory
      .filter(i => i.quantity <= i.minStock)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 20)
      .map(i => ({
        id:          i.id,
        productName: i.product.name,
        sku:         i.product.sku      ?? '-',
        category:    i.product.category ?? '-',
        branchName:  i.branch.name,
        quantity:    i.quantity,
        minStock:    i.minStock,
        status:      i.quantity === 0 ? 'out' : 'low',
      }));
  }

  // ── Reporte de ventas detallado (para exportar) ──────────────────────────
  async getSalesReport(tenantId: string, period: string, customStart?: string, customEnd?: string) {
    const { start, end } = this.getDateRange(period, customStart, customEnd);

    const sales = await this.prisma.sale.findMany({
      where:   { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
        client: { select: { firstName: true, lastName: true, companyName: true } },
        items:  { include: { product: { select: { name: true, sku: true, category: true } } } },
      },
    });

    return sales.map(sale => ({
      id:            sale.id.slice(-8).toUpperCase(),
      date:          sale.createdAt.toISOString(),
      branch:        sale.branch.name,
      cashier:       `${sale.user.firstName} ${sale.user.lastName}`,
      client:        sale.client
                       ? (sale.client.companyName ?? `${sale.client.firstName} ${sale.client.lastName ?? ''}`.trim())
                       : 'Consumidor final',
      paymentMethod: sale.paymentMethod,
      subtotal:      Number(sale.subtotal),
      discount:      Number(sale.discount),
      tax:           Number(sale.tax),
      total:         Number(sale.total),
      items:         sale.items.map(item => ({
        product:  item.product?.name ?? '-',
        sku:      item.product?.sku  ?? '-',
        category: item.product?.category ?? '-',
        quantity: item.quantity,
        price:    Number(item.unitPrice),
        discount: Number(item.discount),
        subtotal: Number(item.subtotal ?? (Number(item.unitPrice) * Number(item.quantity))),
      })),
    }));
  }

  async getFullDashboard(tenantId: string, period: string, customStart?: string, customEnd?: string) {
    const [summary, salesByPeriod, topProducts, salesByCategory, branchPerformance, paymentMethods, peakHours, topCashiers, criticalStock] = await Promise.all([
      this.getSummary(tenantId, period, customStart, customEnd),
      this.getSalesByPeriod(tenantId, period, customStart, customEnd),
      this.getTopProducts(tenantId, period, 10, customStart, customEnd),
      this.getSalesByCategory(tenantId, period, customStart, customEnd),
      this.getBranchPerformance(tenantId, period, customStart, customEnd),
      this.getPaymentMethods(tenantId, period, customStart, customEnd),
      this.getPeakHours(tenantId, period, customStart, customEnd),
      this.getTopCashiers(tenantId, period, 8, customStart, customEnd),
      this.getCriticalStock(tenantId),
    ]);

    return { summary, salesByPeriod, topProducts, salesByCategory, branchPerformance, paymentMethods, peakHours, topCashiers, criticalStock };
  }
}

