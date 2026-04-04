import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProduceService {
  constructor(private prisma: PrismaService) {}

  private calculateFreshness(expirationDate?: Date | null, shelfLifeDays = 7): string {
    if (!expirationDate) return 'fresh';
    const now = new Date();
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const ratio = daysLeft / shelfLifeDays;
    if (daysLeft <= 0) return 'expired';
    if (ratio <= 0.15) return 'critical';
    if (ratio <= 0.30) return 'warning';
    if (ratio <= 0.60) return 'good';
    return 'fresh';
  }

  // ════════════════════════════════════════
  // PRODUCTOS DE VERDULERÍA
  // ════════════════════════════════════════

  async findAllProduceProducts(tenantId: string, section?: string) {
    return this.prisma.produceProduct.findMany({
      where: { tenantId, active: true, ...(section && { section }) },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, category: true } },
        harvestLots: {
          where: { active: true, freshnessStatus: { not: 'expired' } },
          orderBy: { expirationDate: 'asc' },
          take: 1,
        },
        _count: { select: { harvestLots: true } },
      },
      orderBy: [{ section: 'asc' }, { product: { name: 'asc' } }],
    });
  }

  async createProduceProduct(tenantId: string, data: {
    productId: string;
    section: string;
    weightUnit: string;
    pricePerUnit: number;
    shelfLifeDays: number;
    minTemperature?: number;
    maxTemperature?: number;
    origin?: string;
    seasonal?: boolean;
    seasonStart?: number;
    seasonEnd?: number;
  }) {
    const product = await this.prisma.product.findFirst({ where: { id: data.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const existing = await this.prisma.produceProduct.findUnique({
      where: { tenantId_productId: { tenantId, productId: data.productId } },
    });
    if (existing) throw new BadRequestException('Este producto ya está registrado en verdulería');

    return this.prisma.produceProduct.create({
      data: { tenantId, ...data as any },
      include: { product: { select: { name: true } } },
    });
  }

  async updateProduceProduct(tenantId: string, id: string, data: any) {
    const pp = await this.prisma.produceProduct.findFirst({ where: { id, tenantId } });
    if (!pp) throw new NotFoundException('Producto no encontrado');
    return this.prisma.produceProduct.update({ where: { id }, data });
  }

  async updatePrice(tenantId: string, id: string, price: number, reason?: string) {
    const pp = await this.prisma.produceProduct.findFirst({ where: { id, tenantId } });
    if (!pp) throw new NotFoundException('Producto no encontrado');

    await this.prisma.producePriceHistory.create({
      data: { tenantId, produceProductId: id, price, reason },
    });

    return this.prisma.produceProduct.update({
      where: { id },
      data: { pricePerUnit: price },
    });
  }

  async getPriceHistory(tenantId: string, id: string) {
    return this.prisma.producePriceHistory.findMany({
      where: { tenantId, produceProductId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // ════════════════════════════════════════
  // LOTES DE COSECHA
  // ════════════════════════════════════════

  async findAllHarvestLots(tenantId: string, branchId?: string, status?: string) {
    return this.prisma.harvestLot.findMany({
      where: {
        tenantId,
        active: true,
        ...(branchId && { branchId }),
        ...(status && { freshnessStatus: status as any }),
      },
      include: {
        produceProduct: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        supplier: { select: { name: true } },
        branch: { select: { name: true } },
        _count: { select: { wastes: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });
  }

  async createHarvestLot(tenantId: string, data: {
    produceProductId: string;
    branchId?: string;
    supplierId?: string;
    lotCode: string;
    quantity: number;
    weightUnit: string;
    unitCost?: number;
    harvestDate?: string;
    expirationDate?: string;
    temperature?: number;
    origin?: string;
    notes?: string;
  }) {
    const pp = await this.prisma.produceProduct.findFirst({
      where: { id: data.produceProductId, tenantId },
    });
    if (!pp) throw new NotFoundException('Producto de verdulería no encontrado');

    const expirationDate = data.expirationDate
      ? new Date(data.expirationDate)
      : data.harvestDate
        ? new Date(new Date(data.harvestDate).getTime() + pp.shelfLifeDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + pp.shelfLifeDays * 24 * 60 * 60 * 1000);

    const freshnessStatus = this.calculateFreshness(expirationDate, pp.shelfLifeDays) as any;

    return this.prisma.harvestLot.create({
      data: {
        tenantId,
        produceProductId: data.produceProductId,
        branchId: data.branchId,
        supplierId: data.supplierId,
        lotCode: data.lotCode,
        quantity: data.quantity,
        weightUnit: data.weightUnit as any,
        unitCost: data.unitCost,
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : undefined,
        expirationDate,
        freshnessStatus,
        temperature: data.temperature,
        origin: data.origin,
        notes: data.notes,
      },
      include: {
        produceProduct: { include: { product: { select: { name: true } } } },
        supplier: { select: { name: true } },
      },
    });
  }

  async updateLotFreshness(tenantId: string) {
    const lots = await this.prisma.harvestLot.findMany({
      where: { tenantId, active: true, freshnessStatus: { not: 'expired' } },
      include: { produceProduct: true },
    });

    const updates = [];
    for (const lot of lots) {
      const newStatus = this.calculateFreshness(lot.expirationDate, lot.produceProduct.shelfLifeDays);
      if (newStatus !== lot.freshnessStatus) {
        updates.push(
          this.prisma.harvestLot.update({
            where: { id: lot.id },
            data: { freshnessStatus: newStatus as any },
          })
        );
      }
    }

    await Promise.all(updates);
    return { updated: updates.length };
  }

  async updateLotTemperature(tenantId: string, lotId: string, temperature: number) {
    const lot = await this.prisma.harvestLot.findFirst({
      where: { id: lotId, tenantId },
      include: { produceProduct: true },
    });
    if (!lot) throw new NotFoundException('Lote no encontrado');

    const alerts = [];
    if (lot.produceProduct.minTemperature && temperature < Number(lot.produceProduct.minTemperature)) {
      alerts.push(`Temperatura muy baja. Mínimo: ${lot.produceProduct.minTemperature}°C`);
    }
    if (lot.produceProduct.maxTemperature && temperature > Number(lot.produceProduct.maxTemperature)) {
      alerts.push(`Temperatura muy alta. Máximo: ${lot.produceProduct.maxTemperature}°C`);
    }

    await this.prisma.harvestLot.update({
      where: { id: lotId },
      data: { temperature },
    });

    return { temperature, alerts };
  }

  async discardLot(tenantId: string, lotId: string) {
    const lot = await this.prisma.harvestLot.findFirst({ where: { id: lotId, tenantId } });
    if (!lot) throw new NotFoundException('Lote no encontrado');

    await this.prisma.produceWaste.create({
      data: {
        tenantId,
        harvestLotId: lotId,
        quantity: lot.quantity,
        weightUnit: lot.weightUnit,
        reason: 'Lote descartado por vencimiento',
        cost: lot.unitCost ? Number(lot.unitCost) * Number(lot.quantity) : undefined,
      },
    });

    return this.prisma.harvestLot.update({
      where: { id: lotId },
      data: { active: false, freshnessStatus: 'expired' },
    });
  }

  // ════════════════════════════════════════
  // MERMAS
  // ════════════════════════════════════════

  async findAllWastes(tenantId: string) {
    return this.prisma.produceWaste.findMany({
      where: { tenantId },
      include: {
        product: { select: { name: true } },
        harvestLot: {
          include: { produceProduct: { include: { product: { select: { name: true } } } } },
        },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createWaste(tenantId: string, data: {
    harvestLotId?: string;
    productId?: string;
    branchId?: string;
    quantity: number;
    weightUnit: string;
    reason: string;
    cost?: number;
    reportedBy?: string;
  }) {
    if (data.harvestLotId) {
      const lot = await this.prisma.harvestLot.findFirst({ where: { id: data.harvestLotId, tenantId } });
      if (!lot) throw new NotFoundException('Lote no encontrado');
      if (Number(lot.quantity) < data.quantity) throw new BadRequestException('La merma supera la cantidad disponible en el lote');

      await this.prisma.harvestLot.update({
        where: { id: data.harvestLotId },
        data: { quantity: { decrement: data.quantity } },
      });
    }

    return this.prisma.produceWaste.create({
      data: { tenantId, ...data as any },
      include: {
        product: { select: { name: true } },
        harvestLot: { include: { produceProduct: { include: { product: { select: { name: true } } } } } },
      },
    });
  }

  // ════════════════════════════════════════
  // SECCIONES DE ALMACENAMIENTO
  // ════════════════════════════════════════

  async findAllSections(tenantId: string) {
    return this.prisma.storageSection.findMany({
      where: { tenantId, active: true },
      include: { branch: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createSection(tenantId: string, data: {
    name: string;
    description?: string;
    temperature?: number;
    humidity?: number;
    capacity?: number;
    unit?: string;
    branchId?: string;
  }) {
    return this.prisma.storageSection.create({ data: { tenantId, ...data } });
  }

  async updateSectionConditions(tenantId: string, sectionId: string, data: { temperature?: number; humidity?: number }) {
    const section = await this.prisma.storageSection.findFirst({ where: { id: sectionId, tenantId } });
    if (!section) throw new NotFoundException('Sección no encontrada');
    return this.prisma.storageSection.update({ where: { id: sectionId }, data });
  }

  // ════════════════════════════════════════
  // PROVEEDORES (reutiliza Supplier)
  // ════════════════════════════════════════

  async findAllSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, active: true },
      include: {
        _count: { select: { harvestLots: true, purchaseOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(tenantId: string, data: any) {
    return this.prisma.supplier.create({ data: { tenantId, ...data } });
  }

  // ════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalLots,
      freshLots,
      warningLots,
      criticalLots,
      expiredLots,
      totalProducts,
      monthWastes,
      monthSales,
      sections,
    ] = await Promise.all([
      this.prisma.harvestLot.count({ where: { tenantId, active: true } }),
      this.prisma.harvestLot.count({ where: { tenantId, active: true, freshnessStatus: { in: ['fresh', 'good'] } } }),
      this.prisma.harvestLot.count({ where: { tenantId, active: true, freshnessStatus: 'warning' } }),
      this.prisma.harvestLot.count({ where: { tenantId, active: true, freshnessStatus: 'critical' } }),
      this.prisma.harvestLot.count({ where: { tenantId, active: true, freshnessStatus: 'expired' } }),
      this.prisma.produceProduct.count({ where: { tenantId, active: true } }),
      this.prisma.produceWaste.aggregate({
        where: { tenantId, createdAt: { gte: monthStart } },
        _sum: { cost: true, quantity: true },
        _count: { id: true },
      }),
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: monthStart }, status: 'completed' },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.storageSection.findMany({
        where: { tenantId, active: true },
      }),
    ]);

    const expiringIn3 = await this.prisma.harvestLot.findMany({
      where: {
        tenantId, active: true,
        expirationDate: { gte: today, lte: in3Days },
        freshnessStatus: { not: 'expired' },
      },
      include: {
        produceProduct: { include: { product: { select: { name: true } } } },
      },
      orderBy: { expirationDate: 'asc' },
    });

    const sectionBreakdown = await this.prisma.produceProduct.groupBy({
      by: ['section'],
      where: { tenantId, active: true },
      _count: { id: true },
    });

    return {
      totalLots,
      freshLots,
      warningLots,
      criticalLots,
      expiredLots,
      totalProducts,
      monthWasteCost: Number(monthWastes._sum.cost ?? 0),
      monthWasteCount: monthWastes._count.id,
      monthWasteQty: Number(monthWastes._sum.quantity ?? 0),
      monthRevenue: Number(monthSales._sum.total ?? 0),
      monthSalesCount: monthSales._count.id,
      sections: sections.length,
      expiringIn3,
      sectionBreakdown: sectionBreakdown.map(s => ({ section: s.section, count: s._count.id })),
    };
  }

  async getAlerts(tenantId: string) {
    const [critical, expired, temperatureAlerts] = await Promise.all([
      this.prisma.harvestLot.findMany({
        where: { tenantId, active: true, freshnessStatus: { in: ['critical', 'warning'] } },
        include: {
          produceProduct: { include: { product: { select: { name: true } } } },
          branch: { select: { name: true } },
        },
        orderBy: { expirationDate: 'asc' },
      }),
      this.prisma.harvestLot.findMany({
        where: { tenantId, active: true, freshnessStatus: 'expired' },
        include: {
          produceProduct: { include: { product: { select: { name: true } } } },
          branch: { select: { name: true } },
        },
      }),
      this.prisma.harvestLot.findMany({
        where: {
          tenantId,
          active: true,
          temperature: { not: null },
        },
        include: {
          produceProduct: true,
          branch: { select: { name: true } },
        },
      }).then(lots => lots.filter(lot => {
        if (!lot.temperature) return false;
        const temp = Number(lot.temperature);
        const min = lot.produceProduct.minTemperature ? Number(lot.produceProduct.minTemperature) : null;
        const max = lot.produceProduct.maxTemperature ? Number(lot.produceProduct.maxTemperature) : null;
        return (min !== null && temp < min) || (max !== null && temp > max);
      })),
    ]);

    return { critical, expired, temperatureAlerts };
  }
}