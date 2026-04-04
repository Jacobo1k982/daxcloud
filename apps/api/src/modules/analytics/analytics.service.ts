import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: string) {
    const now = new Date();
    const start = new Date();
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }
    return { start, end: now };
  }

  async getSummary(tenantId: string, period: string) {
    const { start, end } = this.getDateRange(period);

    // Período anterior para comparativa
    const diff = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - diff);
    const prevEnd = new Date(start);

    const [current, previous, totalProducts, totalInventoryValue] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' },
        _sum: { total: true, discount: true },
        _count: { id: true },
        _avg: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: prevStart, lte: prevEnd }, status: 'completed' },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.product.count({ where: { tenantId, active: true } }),
      this.prisma.inventory.aggregate({
        where: { branch: { tenantId } },
        _sum: { quantity: true },
      }),
    ]);

    const revenue = Number(current._sum.total ?? 0);
    const prevRevenue = Number(previous._sum.total ?? 0);
    const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    const salesCount = current._count.id;
    const prevSalesCount = previous._count.id;
    const salesChange = prevSalesCount > 0 ? ((salesCount - prevSalesCount) / prevSalesCount) * 100 : 0;

    const avgTicket = Number(current._avg.total ?? 0);
    const totalDiscount = Number(current._sum.discount ?? 0);

    return {
      revenue,
      revenueChange: Math.round(revenueChange * 10) / 10,
      salesCount,
      salesChange: Math.round(salesChange * 10) / 10,
      avgTicket: Math.round(avgTicket * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalProducts,
      totalInventoryUnits: totalInventoryValue._sum.quantity ?? 0,
    };
  }

  async getSalesByPeriod(tenantId: string, period: string) {
    const { start } = this.getDateRange(period);

    const sales = await this.prisma.sale.findMany({
      where: { tenantId, createdAt: { gte: start }, status: 'completed' },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupa por día
    const grouped: Record<string, { date: string; revenue: number; count: number }> = {};
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = { date, revenue: 0, count: 0 };
      grouped[date].revenue += Number(sale.total);
      grouped[date].count += 1;
    });

    return Object.values(grouped).map(d => ({
      ...d,
      revenue: Math.round(d.revenue * 100) / 100,
    }));
  }

  async getTopProducts(tenantId: string, period: string, limit = 10) {
    const { start } = this.getDateRange(period);

    const items = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: { tenantId, createdAt: { gte: start }, status: 'completed' },
      },
      _sum: { quantity: true, subtotal: true },
      _count: { id: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: limit,
    });

    const products = await Promise.all(
      items.map(async item => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, category: true, sku: true },
        });
        return {
          productId: item.productId,
          name: product?.name ?? 'Producto eliminado',
          category: product?.category ?? '-',
          sku: product?.sku ?? '-',
          quantity: item._sum.quantity ?? 0,
          revenue: Math.round(Number(item._sum.subtotal ?? 0) * 100) / 100,
          transactions: item._count.id,
        };
      })
    );

    return products;
  }

  async getBranchPerformance(tenantId: string, period: string) {
    const { start } = this.getDateRange(period);

    const branches = await this.prisma.branch.findMany({
      where: { tenantId, active: true },
    });

    const performance = await Promise.all(
      branches.map(async branch => {
        const stats = await this.prisma.sale.aggregate({
          where: { branchId: branch.id, createdAt: { gte: start }, status: 'completed' },
          _sum: { total: true },
          _count: { id: true },
          _avg: { total: true },
        });
        return {
          branchId: branch.id,
          name: branch.name,
          revenue: Math.round(Number(stats._sum.total ?? 0) * 100) / 100,
          salesCount: stats._count.id,
          avgTicket: Math.round(Number(stats._avg.total ?? 0) * 100) / 100,
        };
      })
    );

    const totalRevenue = performance.reduce((acc, b) => acc + b.revenue, 0);
    return performance.map(b => ({
      ...b,
      percentage: totalRevenue > 0 ? Math.round((b.revenue / totalRevenue) * 1000) / 10 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  async getPaymentMethods(tenantId: string, period: string) {
    const { start } = this.getDateRange(period);

    const methods = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { tenantId, createdAt: { gte: start }, status: 'completed' },
      _sum: { total: true },
      _count: { id: true },
    });

    const total = methods.reduce((acc, m) => acc + m._count.id, 0);
    const labels: Record<string, string> = {
      cash: 'Efectivo', card: 'Tarjeta',
      transfer: 'Transferencia', mixed: 'Mixto',
    };

    return methods.map(m => ({
      method: m.paymentMethod,
      label: labels[m.paymentMethod] ?? m.paymentMethod,
      revenue: Math.round(Number(m._sum.total ?? 0) * 100) / 100,
      count: m._count.id,
      percentage: total > 0 ? Math.round((m._count.id / total) * 1000) / 10 : 0,
    })).sort((a, b) => b.count - a.count);
  }

  async getPeakHours(tenantId: string, period: string) {
    const { start } = this.getDateRange(period);

    const sales = await this.prisma.sale.findMany({
      where: { tenantId, createdAt: { gte: start }, status: 'completed' },
      select: { createdAt: true, total: true },
    });

    const hours: Record<number, { hour: number; count: number; revenue: number }> = {};
    for (let i = 0; i < 24; i++) hours[i] = { hour: i, count: 0, revenue: 0 };

    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      hours[hour].count += 1;
      hours[hour].revenue += Number(sale.total);
    });

    return Object.values(hours).map(h => ({
      ...h,
      revenue: Math.round(h.revenue * 100) / 100,
      label: `${h.hour.toString().padStart(2, '0')}:00`,
    }));
  }

  async getTopCashiers(tenantId: string, period: string, limit = 8) {
    const { start } = this.getDateRange(period);

    const cashiers = await this.prisma.sale.groupBy({
      by: ['userId'],
      where: { tenantId, createdAt: { gte: start }, status: 'completed' },
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    return Promise.all(
      cashiers.map(async c => {
        const user = await this.prisma.user.findUnique({
          where: { id: c.userId },
          select: { firstName: true, lastName: true, role: true, avatarUrl: true },
        });
        return {
          userId: c.userId,
          name: user ? `${user.firstName} ${user.lastName}` : 'Usuario eliminado',
          role: user?.role ?? '-',
          avatarUrl: user?.avatarUrl,
          revenue: Math.round(Number(c._sum.total ?? 0) * 100) / 100,
          salesCount: c._count.id,
          avgTicket: Math.round(Number(c._avg.total ?? 0) * 100) / 100,
        };
      })
    );
  }

  async getCriticalStock(tenantId: string) {
    const inventory = await this.prisma.inventory.findMany({
      where: {
        branch: { tenantId },
        quantity: { lte: this.prisma.inventory.fields.minStock as any },
      },
      include: {
        product: { select: { name: true, sku: true, category: true } },
        branch: { select: { name: true } },
      },
      orderBy: { quantity: 'asc' },
      take: 20,
    });

    // Fallback manual si el where con fields no funciona
    const allInventory = await this.prisma.inventory.findMany({
      where: { branch: { tenantId } },
      include: {
        product: { select: { name: true, sku: true, category: true } },
        branch: { select: { name: true } },
      },
    });

    const critical = allInventory.filter(i => i.quantity <= i.minStock);

    return critical.slice(0, 20).map(i => ({
      id: i.id,
      productName: i.product.name,
      sku: i.product.sku ?? '-',
      category: i.product.category ?? '-',
      branchName: i.branch.name,
      quantity: i.quantity,
      minStock: i.minStock,
      status: i.quantity === 0 ? 'out' : 'low',
    })).sort((a, b) => a.quantity - b.quantity);
  }

  async getFullDashboard(tenantId: string, period: string) {
    const [summary, salesByPeriod, topProducts, branchPerformance, paymentMethods, peakHours, topCashiers, criticalStock] = await Promise.all([
      this.getSummary(tenantId, period),
      this.getSalesByPeriod(tenantId, period),
      this.getTopProducts(tenantId, period),
      this.getBranchPerformance(tenantId, period),
      this.getPaymentMethods(tenantId, period),
      this.getPeakHours(tenantId, period),
      this.getTopCashiers(tenantId, period),
      this.getCriticalStock(tenantId),
    ]);

    return {
      summary,
      salesByPeriod,
      topProducts,
      branchPerformance,
      paymentMethods,
      peakHours,
      topCashiers,
      criticalStock,
    };
  }
}