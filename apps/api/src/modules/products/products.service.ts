import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters?: { category?: string; search?: string }) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        active: true,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
            { barcode: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, active: true },
      include: { inventory: { include: { branch: true } } },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { tenantId, barcode, active: true },
      include: { inventory: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(tenantId: string, data: {
    name: string;
    price: number;
    sku?: string;
    barcode?: string;
    description?: string;
    category?: string;
    cost?: number;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.product.create({
      data: {
        tenantId,
        name: data.name,
        price: data.price,
        sku: data.sku,
        barcode: data.barcode,
        description: data.description,
        category: data.category,
        cost: data.cost,
        metadata: data.metadata ?? Prisma.JsonNull,
        imageUrl: data.imageUrl,
      },
    });
  }

  async update(tenantId: string, productId: string, data: {
    name?: string;
    price?: number;
    sku?: string;
    barcode?: string;
    description?: string;
    category?: string;
    cost?: number;
    metadata?: Prisma.InputJsonValue;
  }) {
    await this.findOne(tenantId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
  }

  async remove(tenantId: string, productId: string) {
    await this.findOne(tenantId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { active: false },
    });
  }

  async getCategories(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return products.map(p => p.category).filter(Boolean);
  }
}
