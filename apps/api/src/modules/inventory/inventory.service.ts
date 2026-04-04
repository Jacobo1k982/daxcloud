import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Prisma } from '@prisma/client';

interface AddStockInput {
  productId:      string;
  branchId:       string;
  quantity:       number;
  type?:          'in' | 'out' | 'adjustment';
  reason?:        string;
  documentNumber?: string;
  supplier?:      string;
  unitCost?:      number;
  location?:      string;
  lotNumber?:     string;
  expirationDate?: string;
  serialNumber?:  string;
  lotBarcode?:    string;
  notes?:         string;
  minStock?:      number;
  maxStock?:      number;
}

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async findByBranch(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    return this.prisma.inventory.findMany({
      where:   { branchId },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });
  }

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
        ...(data.location  &&             { location: data.location  }),
      };

      const quantityChange = movementType === 'out'
        ? { decrement: data.quantity }
        : movementType === 'adjustment'
        ? undefined
        : { increment: data.quantity };

      if (quantityChange) {
        inventoryData.quantity = quantityChange;
      }

      const inv = await tx.inventory.upsert({
        where: {
          productId_branchId: {
            productId: data.productId,
            branchId:  data.branchId,
          },
        },
        update: inventoryData,
        create: {
          productId: data.productId,
          branchId:  data.branchId,
          quantity:  movementType === 'out' ? 0 : data.quantity,
          minStock:  data.minStock ?? 5,
          maxStock:  data.maxStock ?? null,
          location:  data.location ?? null,
        },
      });

      // Para ajuste, setear cantidad directamente
      if (movementType === 'adjustment') {
        await tx.inventory.update({
          where: { id: inv.id },
          data:  { quantity: data.quantity },
        });
      }

      await tx.movement.create({
        data: {
          inventoryId:    inv.id,
          type:           movementType,
          quantity:       data.quantity,
          reason:         data.reason         ?? null,
          documentNumber: data.documentNumber ?? null,
          supplier:       data.supplier       ?? null,
          unitCost:       data.unitCost       ?? null,
          location:       data.location       ?? null,
          lotNumber:      data.lotNumber      ?? null,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
          serialNumber:   data.serialNumber   ?? null,
          lotBarcode:     data.lotBarcode     ?? null,
          notes:          data.notes          ?? null,
        },
      });

      return inv;
    });

    // ── Notificación: stock bajo ───────────────────────
    // Lee el stock final (post-transacción) para tener el valor real
    const finalInventory = await this.prisma.inventory.findUnique({
      where: { productId_branchId: { productId: data.productId, branchId: data.branchId } },
    });

    if (finalInventory) {
      const finalQty  = finalInventory.quantity;
      const minStock  = finalInventory.minStock ?? LOW_STOCK_THRESHOLD;

      if (movementType !== 'in' && finalQty <= minStock && finalQty >= 0) {
        this.notificationsGateway.pushToTenant(tenantId, {
          type:    'low_stock',
          title:   'Stock bajo',
          message: `${product.name} tiene solo ${finalQty} unidad${finalQty !== 1 ? 'es' : ''} en ${branch.name}`,
          color:   '#F0A030',
          link:    `/inventory`,
        }).catch(() => {});
      }

      // ── Notificación: sin stock ──────────────────────
      if (finalQty === 0) {
        this.notificationsGateway.pushToTenant(tenantId, {
          type:    'system',
          title:   '¡Sin stock!',
          message: `${product.name} se quedó sin existencias en ${branch.name}. Reabastece pronto.`,
          color:   '#E05050',
          link:    `/inventory`,
        }).catch(() => {});
      }
    }

    // ── Notificación: reabastecimiento recibido ────────
    if (movementType === 'in') {
      this.notificationsGateway.pushToTenant(tenantId, {
        type:    'reminder',
        title:   'Stock actualizado',
        message: `+${data.quantity} unidad${data.quantity !== 1 ? 'es' : ''} de ${product.name} en ${branch.name}${data.supplier ? ` · ${data.supplier}` : ''}`,
        color:   '#5AAAF0',
        link:    `/inventory`,
      }).catch(() => {});
    }

    return inventory;
  }

  async getLowStock(tenantId: string) {
    const branches = await this.prisma.branch.findMany({
      where:  { tenantId, active: true },
      select: { id: true },
    });

    const branchIds = branches.map(b => b.id);

    // Trae todos y filtra en memoria — Prisma no soporta
    // comparar dos campos del mismo modelo en el where
    const all = await this.prisma.inventory.findMany({
      where:   { branchId: { in: branchIds } },
      include: { product: true, branch: true },
    });

    return all.filter(inv => inv.quantity <= (inv.minStock ?? LOW_STOCK_THRESHOLD));
  }

  async getMovements(tenantId: string, productId: string, branchId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId_branchId: { productId, branchId } },
    });
    if (!inventory) throw new NotFoundException('Inventario no encontrado');

    return this.prisma.movement.findMany({
      where:   { inventoryId: inventory.id },
      orderBy: { createdAt: 'desc' },
      take:    100,
    });
  }
}