import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClothingService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════
  // VARIANTES (TALLAS Y COLORES)
  // ════════════════════════════════════════

  async findVariantsByProduct(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.productVariant.findMany({
      where: { productId, tenantId, active: true },
      orderBy: [{ color: 'asc' }, { size: 'asc' }],
    });
  }

  async findAllVariants(tenantId: string, search?: string) {
    return this.prisma.productVariant.findMany({
      where: {
        tenantId,
        active: true,
        ...(search && {
          OR: [
            { product: { name: { contains: search, mode: 'insensitive' } } },
            { color: { contains: search, mode: 'insensitive' } },
            { size: { contains: search } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        product: { select: { name: true, category: true, imageUrl: true, price: true } },
      },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async createVariant(tenantId: string, data: {
    productId: string;
    size?: string;
    color?: string;
    colorHex?: string;
    sku?: string;
    barcode?: string;
    price?: number;
    stock: number;
  }) {
    const product = await this.prisma.product.findFirst({ where: { id: data.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.productVariant.create({
      data: { tenantId, ...data },
      include: { product: { select: { name: true } } },
    });
  }

  async createBulkVariants(tenantId: string, productId: string, data: {
    sizes: string[];
    colors: { name: string; hex: string }[];
    basePrice?: number;
    initialStock?: number;
  }) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const variants = [];
    for (const color of data.colors) {
      for (const size of data.sizes) {
        const variant = await this.prisma.productVariant.create({
          data: {
            tenantId,
            productId,
            size,
            color: color.name,
            colorHex: color.hex,
            price: data.basePrice ?? Number(product.price),
            stock: data.initialStock ?? 0,
            sku: `${product.sku ?? productId.slice(0,4)}-${color.name.slice(0,3).toUpperCase()}-${size}`,
          },
        });
        variants.push(variant);
      }
    }
    return variants;
  }

  async updateVariant(tenantId: string, variantId: string, data: {
    size?: string;
    color?: string;
    colorHex?: string;
    price?: number;
    stock?: number;
    sku?: string;
    barcode?: string;
  }) {
    const variant = await this.prisma.productVariant.findFirst({ where: { id: variantId, tenantId } });
    if (!variant) throw new NotFoundException('Variante no encontrada');

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data,
      include: { product: { select: { name: true } } },
    });
  }

  async updateVariantStock(tenantId: string, variantId: string, quantity: number, operation: 'set' | 'increment' | 'decrement') {
    const variant = await this.prisma.productVariant.findFirst({ where: { id: variantId, tenantId } });
    if (!variant) throw new NotFoundException('Variante no encontrada');

    let newStock = variant.stock;
    if (operation === 'set') newStock = quantity;
    else if (operation === 'increment') newStock = variant.stock + quantity;
    else if (operation === 'decrement') {
      if (variant.stock < quantity) throw new BadRequestException('Stock insuficiente');
      newStock = variant.stock - quantity;
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });
  }

  async deleteVariant(tenantId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({ where: { id: variantId, tenantId } });
    if (!variant) throw new NotFoundException('Variante no encontrada');
    return this.prisma.productVariant.update({ where: { id: variantId }, data: { active: false } });
  }

  // ════════════════════════════════════════
  // COLECCIONES / TEMPORADAS
  // ════════════════════════════════════════

  async findAllCollections(tenantId: string) {
    return this.prisma.collection.findMany({
      where: { tenantId, active: true },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, price: true, category: true },
            },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });
  }

  async createCollection(tenantId: string, data: {
    name: string;
    description?: string;
    season?: string;
    year?: number;
  }) {
    return this.prisma.collection.create({
      data: { tenantId, ...data },
    });
  }

  async updateCollection(tenantId: string, collectionId: string, data: any) {
    const collection = await this.prisma.collection.findFirst({ where: { id: collectionId, tenantId } });
    if (!collection) throw new NotFoundException('Colección no encontrada');
    return this.prisma.collection.update({ where: { id: collectionId }, data });
  }

  async addProductToCollection(tenantId: string, collectionId: string, productId: string) {
    const collection = await this.prisma.collection.findFirst({ where: { id: collectionId, tenantId } });
    if (!collection) throw new NotFoundException('Colección no encontrada');
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.collectionProduct.upsert({
      where: { collectionId_productId: { collectionId, productId } },
      create: { collectionId, productId },
      update: {},
    });
  }

  async removeProductFromCollection(tenantId: string, collectionId: string, productId: string) {
    return this.prisma.collectionProduct.deleteMany({
      where: { collectionId, productId },
    });
  }

  async deleteCollection(tenantId: string, collectionId: string) {
    const collection = await this.prisma.collection.findFirst({ where: { id: collectionId, tenantId } });
    if (!collection) throw new NotFoundException('Colección no encontrada');
    return this.prisma.collection.update({ where: { id: collectionId }, data: { active: false } });
  }

  // ════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════

  async getStats(tenantId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalVariants,
      outOfStock,
      lowStock,
      totalCollections,
      topColors,
      topSizes,
      monthSales,
    ] = await Promise.all([
      this.prisma.productVariant.count({ where: { tenantId, active: true } }),
      this.prisma.productVariant.count({ where: { tenantId, active: true, stock: 0 } }),
      this.prisma.productVariant.count({ where: { tenantId, active: true, stock: { gt: 0, lte: 3 } } }),
      this.prisma.collection.count({ where: { tenantId, active: true } }),
      this.prisma.productVariant.groupBy({
        by: ['color'],
        where: { tenantId, active: true, color: { not: null } },
        _sum: { stock: true },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      }),
      this.prisma.productVariant.groupBy({
        by: ['size'],
        where: { tenantId, active: true, size: { not: null } },
        _sum: { stock: true },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: monthStart }, status: 'completed' },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalVariants,
      outOfStock,
      lowStock,
      totalCollections,
      monthRevenue: Number(monthSales._sum.total ?? 0),
      monthSalesCount: monthSales._count.id,
      topColors: topColors.map(c => ({ color: c.color, count: c._count.id, stock: c._sum.stock ?? 0 })),
      topSizes: topSizes.map(s => ({ size: s.size, count: s._count.id, stock: s._sum.stock ?? 0 })),
    };
  }

  async getCriticalStock(tenantId: string) {
    return this.prisma.productVariant.findMany({
      where: { tenantId, active: true, stock: { lte: 3 } },
      include: { product: { select: { name: true, category: true, imageUrl: true } } },
      orderBy: { stock: 'asc' },
      take: 30,
    });
  }
}