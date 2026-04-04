import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PharmacyService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════
  // LOTES
  // ════════════════════════════════════════

  async findAllLots(tenantId: string, branchId?: string, productId?: string) {
    return this.prisma.lot.findMany({
      where: {
        tenantId,
        active: true,
        ...(branchId && { branchId }),
        ...(productId && { productId }),
      },
      include: {
        product: { select: { name: true, sku: true, barcode: true, category: true } },
        branch: { select: { name: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });
  }

  async createLot(tenantId: string, data: {
    productId: string;
    branchId?: string;
    lotNumber: string;
    quantity: number;
    expirationDate?: string;
    supplier?: string;
    unitCost?: number;
  }) {
    const product = await this.prisma.product.findFirst({ where: { id: data.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const lot = await this.prisma.lot.create({
      data: {
        tenantId,
        productId: data.productId,
        branchId: data.branchId,
        lotNumber: data.lotNumber,
        quantity: data.quantity,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
        supplier: data.supplier,
        unitCost: data.unitCost,
      },
      include: {
        product: { select: { name: true, sku: true } },
        branch: { select: { name: true } },
      },
    });

    // Actualiza inventario
    if (data.branchId) {
      const inventory = await this.prisma.inventory.findFirst({
        where: { productId: data.productId, branchId: data.branchId },
      });
      if (inventory) {
        await this.prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { increment: data.quantity } },
        });
        await this.prisma.movement.create({
          data: {
            inventoryId: inventory.id,
            type: 'in',
            quantity: data.quantity,
            reason: `Ingreso lote ${data.lotNumber}`,
            supplier: data.supplier,
            unitCost: data.unitCost,
            lotNumber: data.lotNumber,
            expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
          },
        });
      }
    }

    return lot;
  }

  async updateLot(tenantId: string, lotId: string, data: Partial<{
    quantity: number;
    expirationDate: string;
    supplier: string;
    unitCost: number;
    active: boolean;
  }>) {
    const lot = await this.prisma.lot.findFirst({ where: { id: lotId, tenantId } });
    if (!lot) throw new NotFoundException('Lote no encontrado');
    return this.prisma.lot.update({
      where: { id: lotId },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.expirationDate && { expirationDate: new Date(data.expirationDate) }),
        ...(data.supplier !== undefined && { supplier: data.supplier }),
        ...(data.unitCost !== undefined && { unitCost: data.unitCost }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
  }

  async getExpiringLots(tenantId: string, daysAhead = 30) {
    const limit = new Date();
    limit.setDate(limit.getDate() + daysAhead);

    return this.prisma.lot.findMany({
      where: {
        tenantId,
        active: true,
        quantity: { gt: 0 },
        expirationDate: { lte: limit },
      },
      include: {
        product: { select: { name: true, sku: true, category: true } },
        branch: { select: { name: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });
  }

  async getExpiredLots(tenantId: string) {
    return this.prisma.lot.findMany({
      where: {
        tenantId,
        active: true,
        quantity: { gt: 0 },
        expirationDate: { lt: new Date() },
      },
      include: {
        product: { select: { name: true, sku: true, category: true } },
        branch: { select: { name: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });
  }

  // ════════════════════════════════════════
  // PRESCRIPCIONES
  // ════════════════════════════════════════

  async findAllPrescriptions(tenantId: string, status?: string) {
    return this.prisma.prescription.findMany({
      where: { tenantId, ...(status && { status }) },
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        branch: { select: { name: true } },
        client: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePrescription(tenantId: string, prescriptionId: string) {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, tenantId },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true, price: true } } } },
        branch: { select: { name: true } },
        client: true,
      },
    });
    if (!prescription) throw new NotFoundException('Prescripción no encontrada');
    return prescription;
  }

  async createPrescription(tenantId: string, data: {
    clientName: string;
    clientId?: string;
    branchId?: string;
    doctorName?: string;
    notes?: string;
    items: { productId: string; quantity: number; dosage?: string; instructions?: string }[];
  }) {
    for (const item of data.items) {
      const product = await this.prisma.product.findFirst({ where: { id: item.productId, tenantId } });
      if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
    }

    return this.prisma.prescription.create({
      data: {
        tenantId,
        clientName: data.clientName,
        clientId: data.clientId,
        branchId: data.branchId,
        doctorName: data.doctorName,
        notes: data.notes,
        status: 'pending',
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            dosage: item.dosage,
            instructions: item.instructions,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { name: true, sku: true, price: true } } } },
      },
    });
  }

  async updatePrescriptionStatus(tenantId: string, prescriptionId: string, status: string) {
    const prescription = await this.findOnePrescription(tenantId, prescriptionId);
    const validStatuses = ['pending', 'dispensed', 'partial', 'cancelled'];
    if (!validStatuses.includes(status)) throw new BadRequestException('Estado inválido');
    return this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status },
    });
  }

  // ════════════════════════════════════════
  // CLIENTES
  // ════════════════════════════════════════

  async findAllClients(tenantId: string, search?: string) {
    return this.prisma.client.findMany({
      where: {
        tenantId,
        active: true,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { idNumber: { contains: search } },
          ],
        }),
      },
      include: {
        _count: { select: { prescriptions: true, appointments: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findOneClient(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        prescriptions: {
          include: { items: { include: { product: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async createClient(tenantId: string, data: {
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
    idNumber?: string;
    birthDate?: string;
    notes?: string;
  }) {
    return this.prisma.client.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        idNumber: data.idNumber,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        notes: data.notes,
      },
    });
  }

  async updateClient(tenantId: string, clientId: string, data: any) {
    await this.findOneClient(tenantId, clientId);
    return this.prisma.client.update({ where: { id: clientId }, data });
  }

  // ════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════

  async getStats(tenantId: string) {
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const [
      totalLots,
      expiredLots,
      expiringIn7,
      expiringIn30,
      pendingPrescriptions,
      totalClients,
      monthSales,
    ] = await Promise.all([
      this.prisma.lot.count({ where: { tenantId, active: true, quantity: { gt: 0 } } }),
      this.prisma.lot.count({ where: { tenantId, active: true, quantity: { gt: 0 }, expirationDate: { lt: today } } }),
      this.prisma.lot.count({ where: { tenantId, active: true, quantity: { gt: 0 }, expirationDate: { gte: today, lte: in7Days } } }),
      this.prisma.lot.count({ where: { tenantId, active: true, quantity: { gt: 0 }, expirationDate: { gte: today, lte: in30Days } } }),
      this.prisma.prescription.count({ where: { tenantId, status: 'pending' } }),
      this.prisma.client.count({ where: { tenantId, active: true } }),
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }, status: 'completed' },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalLots,
      expiredLots,
      expiringIn7,
      expiringIn30,
      pendingPrescriptions,
      totalClients,
      monthRevenue: Number(monthSales._sum.total ?? 0),
      monthSalesCount: monthSales._count.id,
    };
  }
}