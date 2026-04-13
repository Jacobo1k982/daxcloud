import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Prisma } from '@prisma/client';

interface AddStockInput {
  productId: string;
  branchId: string;
  quantity: number;
  type?: 'in' | 'out' | 'adjustment';
  reason?: string;
  documentNumber?: string;
  supplier?: string;
  unitCost?: number;
  location?: string;
  lotNumber?: string;
  expirationDate?: string;
  serialNumber?: string;
  lotBarcode?: string;
  notes?: string;
  minStock?: number;
  maxStock?: number;
}

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) { }

  // ── Listar inventario por sucursal ────────────────────────────────────────
  async findByBranch(tenantId: string, branchId: string, filters?: {
    search?: string;
    status?: string;
    category?: string;
  }) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    const where: any = { branchId };

    if (filters?.search) {
      where.product = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { barcode: { contains: filters.search } },
          { category: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    if (filters?.category) {
      where.product = { ...where.product, category: filters.category };
    }

    const items = await this.prisma.inventory.findMany({
      where,
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });

    // Filtrar por status después de traer los datos
    if (filters?.status) {
      return items.filter(item => {
        const qty = item.quantity;
        const min = item.minStock ?? LOW_STOCK_THRESHOLD;
        const max = item.maxStock;
        switch (filters.status) {
          case 'ok': return qty > min && (!max || qty <= max);
          case 'low': return qty > 0 && qty <= min;
          case 'empty': return qty === 0;
          case 'overstock': return max !== null && qty > max;
          default: return true;
        }
      });
    }

    return items;
  }

  // ── Stats de inventario ───────────────────────────────────────────────────
  async getStats(tenantId: string, branchId: string) {
    const items = await this.prisma.inventory.findMany({
      where: { branchId, branch: { tenantId } },
      include: { product: true },
    });

    const total = items.length;
    const empty = items.filter(i => i.quantity === 0).length;
    const low = items.filter(i => i.quantity > 0 && i.quantity <= (i.minStock ?? LOW_STOCK_THRESHOLD)).length;
    const ok = items.filter(i => i.quantity > (i.minStock ?? LOW_STOCK_THRESHOLD)).length;
    const overstock = items.filter(i => i.maxStock !== null && i.quantity > i.maxStock).length;

    const totalValue = items.reduce((sum, i) => {
      return sum + (Number(i.product.cost ?? 0) * i.quantity);
    }, 0);

    return { total, empty, low, ok, overstock, totalValue };
  }

  // ── Stock bajo global ─────────────────────────────────────────────────────
  async getLowStock(tenantId: string) {
    const allInventory = await this.prisma.inventory.findMany({
      where: { branch: { tenantId } },
      include: { product: true, branch: { select: { name: true } } },
    });

    return allInventory.filter(item =>
      item.quantity <= (item.minStock ?? LOW_STOCK_THRESHOLD)
    );
  }

  // ── Historial de movimientos ──────────────────────────────────────────────
  async getMovements(tenantId: string, productId: string, branchId: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { productId, branchId, branch: { tenantId } },
    });
    if (!inventory) return [];

    return this.prisma.movement.findMany({
      where: { inventoryId: inventory.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ── Agregar / mover stock ─────────────────────────────────────────────────
  async addStock(tenantId: string, data: AddStockInput) {
    const product = await this.prisma.product.findFirst({
      where: { id: data.productId, tenantId, active: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const branch = await this.prisma.branch.findFirst({
      where: { id: data.branchId, tenantId, active: true },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    const movementType = data.type ?? 'in';

    const inventory = await this.prisma.$transaction(async (tx) => {
      const inventoryData: Prisma.InventoryUpdateInput = {
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.maxStock !== undefined && { maxStock: data.maxStock }),
        ...(data.location && { location: data.location }),
      };

      const quantityChange = movementType === 'out'
        ? { decrement: data.quantity }
        : movementType === 'adjustment'
          ? undefined
          : { increment: data.quantity };

      if (quantityChange) inventoryData.quantity = quantityChange;

      const inv = await tx.inventory.upsert({
        where: { productId_branchId: { productId: data.productId, branchId: data.branchId } },
        update: inventoryData,
        create: {
          productId: data.productId,
          branchId: data.branchId,
          quantity: movementType === 'in' ? data.quantity : 0,
          minStock: data.minStock ?? LOW_STOCK_THRESHOLD,
          maxStock: data.maxStock ?? null,
          location: data.location ?? null,
        },
      });

      // Registrar movimiento
      await tx.movement.create({
        data: {
          inventoryId: inv.id,
          type: movementType,
          quantity: data.quantity,
          reason: data.reason,
          documentNumber: data.documentNumber,
          supplier: data.supplier,
          unitCost: data.unitCost,
          location: data.location,
          lotNumber: data.lotNumber,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
          serialNumber: data.serialNumber,
          notes: data.notes,
        },
      });

      return inv;
    });

    // Notificación de stock bajo
    const threshold = data.minStock ?? LOW_STOCK_THRESHOLD;
    if (inventory.quantity <= threshold && inventory.quantity > 0) {
      await this.notificationsGateway.pushToTenant(tenantId, {
        type: 'low_stock',
        title: 'Stock bajo',
        message: `${product.name} tiene solo ${inventory.quantity} unidades`,
        icon: 'package',
        color: '#F0A030',
        link: '/inventory',
      }).catch(() => { });
    }

    if (inventory.quantity === 0) {
      await this.notificationsGateway.pushToTenant(tenantId, {
        type: 'low_stock',
        title: 'Producto agotado',
        message: `${product.name} se ha agotado`,
        icon: 'alert-triangle',
        color: '#E05050',
        link: '/inventory',
      }).catch(() => { });
    }

    return inventory;
  }

  // ── Ajuste directo de cantidad ────────────────────────────────────────────
  async adjustStock(tenantId: string, productId: string, branchId: string, data: {
    quantity: number;
    reason?: string;
    notes?: string;
  }) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (data.quantity < 0) throw new BadRequestException('La cantidad no puede ser negativa');

    const inv = await this.prisma.inventory.upsert({
      where: { productId_branchId: { productId, branchId } },
      update: { quantity: data.quantity },
      create: { productId, branchId, quantity: data.quantity, minStock: LOW_STOCK_THRESHOLD },
    });

    await this.prisma.movement.create({
      data: {
        inventoryId: inv.id,
        type: 'adjustment',
        quantity: data.quantity,
        reason: data.reason ?? 'Ajuste manual',
        notes: data.notes,
      },
    });

    return inv;
  }
}
