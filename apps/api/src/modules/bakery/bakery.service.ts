import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BakeryService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════
  // RECETAS
  // ════════════════════════════════════════

  async findAllRecipes(tenantId: string) {
    return this.prisma.recipe.findMany({
      where: { tenantId, active: true },
      include: {
        ingredients: {
          include: { product: { select: { name: true, sku: true, cost: true } } },
        },
        laborCosts: true,
        dailyMinimums: true,
        _count: { select: { productions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneRecipe(tenantId: string, recipeId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, tenantId },
      include: {
        ingredients: {
          include: { product: { select: { id: true, name: true, sku: true, cost: true } } },
        },
        laborCosts: { include: { employee: { select: { firstName: true, lastName: true } } } },
        dailyMinimums: true,
        productions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!recipe) throw new NotFoundException('Receta no encontrada');
    return recipe;
  }

  async createRecipe(tenantId: string, data: {
    name: string;
    description?: string;
    yield: number;
    yieldUnit?: string;
    prepTime?: number;
    ingredients: { productId: string; quantity: number; unit: string }[];
    laborCosts?: { role: string; hoursPerBatch: number; hourlyRate: number }[];
  }) {
    let ingredientCost = 0;
    for (const ing of data.ingredients) {
      const product = await this.prisma.product.findFirst({ where: { id: ing.productId, tenantId } });
      if (!product) throw new NotFoundException(`Producto ${ing.productId} no encontrado`);
      if (product.cost) ingredientCost += Number(product.cost) * ing.quantity;
    }

    let laborCostTotal = 0;
    if (data.laborCosts) {
      for (const lc of data.laborCosts) {
        laborCostTotal += lc.hoursPerBatch * lc.hourlyRate;
      }
    }

    const totalCost = ingredientCost + laborCostTotal;

    return this.prisma.recipe.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        yield: data.yield,
        yieldUnit: data.yieldUnit ?? 'unidades',
        prepTime: data.prepTime,
        cost: totalCost > 0 ? totalCost / data.yield : undefined,
        ingredients: {
          create: data.ingredients.map(ing => ({
            productId: ing.productId,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        },
        ...(data.laborCosts && {
          laborCosts: {
            create: data.laborCosts.map(lc => ({
              tenantId,
              role: lc.role,
              hoursPerBatch: lc.hoursPerBatch,
              hourlyRate: lc.hourlyRate,
            })),
          },
        }),
      },
      include: {
        ingredients: { include: { product: true } },
        laborCosts: true,
      },
    });
  }

  async updateRecipe(tenantId: string, recipeId: string, data: any) {
    await this.findOneRecipe(tenantId, recipeId);
    if (data.ingredients) {
      await this.prisma.recipeIngredient.deleteMany({ where: { recipeId } });
    }
    if (data.laborCosts) {
      await this.prisma.laborCost.deleteMany({ where: { recipeId } });
    }
    return this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.yield && { yield: data.yield }),
        ...(data.yieldUnit && { yieldUnit: data.yieldUnit }),
        ...(data.prepTime !== undefined && { prepTime: data.prepTime }),
        ...(data.ingredients && {
          ingredients: {
            create: data.ingredients.map((ing: any) => ({
              productId: ing.productId,
              quantity: ing.quantity,
              unit: ing.unit,
            })),
          },
        }),
        ...(data.laborCosts && {
          laborCosts: {
            create: data.laborCosts.map((lc: any) => ({
              tenantId,
              role: lc.role,
              hoursPerBatch: lc.hoursPerBatch,
              hourlyRate: lc.hourlyRate,
            })),
          },
        }),
      },
      include: {
        ingredients: { include: { product: true } },
        laborCosts: true,
      },
    });
  }

  async deleteRecipe(tenantId: string, recipeId: string) {
    await this.findOneRecipe(tenantId, recipeId);
    return this.prisma.recipe.update({ where: { id: recipeId }, data: { active: false } });
  }

  async checkIngredientAvailability(tenantId: string, recipeId: string, quantity: number, branchId?: string) {
    const recipe = await this.findOneRecipe(tenantId, recipeId);
    const alerts: { productName: string; required: number; available: number; unit: string; sufficient: boolean }[] = [];

    for (const ing of recipe.ingredients) {
      const required = Number(ing.quantity) * quantity;
      const inventory = branchId
        ? await this.prisma.inventory.findFirst({ where: { productId: ing.productId, branchId } })
        : await this.prisma.inventory.findFirst({ where: { productId: ing.productId, branch: { tenantId } } });

      const available = inventory?.quantity ?? 0;
      alerts.push({
        productName: ing.product.name,
        required,
        available,
        unit: ing.unit,
        sufficient: available >= required,
      });
    }

    return {
      recipeId,
      recipeName: recipe.name,
      quantity,
      canProduce: alerts.every(a => a.sufficient),
      ingredients: alerts,
    };
  }

  // ════════════════════════════════════════
  // TURNOS
  // ════════════════════════════════════════

  async findAllShifts(tenantId: string, date?: string) {
    const filterDate = date ? new Date(date) : new Date();
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.prisma.productionShift.findMany({
      where: {
        tenantId,
        date: { gte: filterDate, lt: nextDay },
      },
      include: {
        branch: { select: { name: true } },
        productions: {
          include: { recipe: { select: { name: true, yieldUnit: true } } },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async createShift(tenantId: string, data: {
    shift: string;
    date: string;
    branchId?: string;
    notes?: string;
  }) {
    return this.prisma.productionShift.create({
      data: {
        tenantId,
        shift: data.shift as any,
        date: new Date(data.date),
        branchId: data.branchId,
        notes: data.notes,
      },
      include: { branch: { select: { name: true } } },
    });
  }

  async closeShift(tenantId: string, shiftId: string) {
    const shift = await this.prisma.productionShift.findFirst({ where: { id: shiftId, tenantId } });
    if (!shift) throw new NotFoundException('Turno no encontrado');
    return this.prisma.productionShift.update({
      where: { id: shiftId },
      data: { status: 'closed', closedAt: new Date() },
    });
  }

  // ════════════════════════════════════════
  // PRODUCCIÓN
  // ════════════════════════════════════════

  async findAllProductions(tenantId: string, branchId?: string) {
    return this.prisma.production.findMany({
      where: { tenantId, ...(branchId && { branchId }) },
      include: {
        recipe: { select: { name: true, yieldUnit: true, cost: true } },
        branch: { select: { name: true } },
        shift: { select: { shift: true, date: true } },
        wastes: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createProduction(tenantId: string, data: {
    recipeId: string;
    branchId?: string;
    shiftId?: string;
    quantity: number;
    plannedAt?: string;
    notes?: string;
  }) {
    await this.findOneRecipe(tenantId, data.recipeId);

    // Verifica disponibilidad de ingredientes
    const availability = await this.checkIngredientAvailability(
      tenantId, data.recipeId, data.quantity, data.branchId
    );

    return this.prisma.production.create({
      data: {
        tenantId,
        recipeId: data.recipeId,
        branchId: data.branchId,
        shiftId: data.shiftId,
        quantity: data.quantity,
        plannedAt: data.plannedAt ? new Date(data.plannedAt) : new Date(),
        notes: data.notes,
        status: 'planned',
      },
      include: {
        recipe: { select: { name: true, yieldUnit: true } },
        branch: { select: { name: true } },
      },
    });
  }

  async updateProductionStatus(tenantId: string, productionId: string, status: string) {
    const production = await this.prisma.production.findFirst({
      where: { id: productionId, tenantId },
      include: { recipe: { include: { ingredients: true } } },
    });
    if (!production) throw new NotFoundException('Producción no encontrada');

    const validStatuses = ['planned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) throw new BadRequestException('Estado inválido');

    const data: any = { status };

    if (status === 'completed' && production.branchId && production.recipe) {
      data.completedAt = new Date();
      for (const ingredient of production.recipe.ingredients) {
        const inventory = await this.prisma.inventory.findFirst({
          where: { productId: ingredient.productId, branchId: production.branchId! },
        });
        if (inventory) {
          const consumed = Number(ingredient.quantity) * production.quantity;
          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { decrement: Math.ceil(consumed) } },
          });
          await this.prisma.movement.create({
            data: {
              inventoryId: inventory.id,
              type: 'out',
              quantity: Math.ceil(consumed),
              reason: `Producción: ${production.recipe.name} x${production.quantity}`,
            },
          });
        }
      }
    }

    return this.prisma.production.update({
      where: { id: productionId },
      data,
      include: {
        recipe: { select: { name: true, yieldUnit: true } },
        branch: { select: { name: true } },
        wastes: true,
      },
    });
  }

  async getDailyProductionPlan(tenantId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [productions, minimums] = await Promise.all([
      this.prisma.production.findMany({
        where: { tenantId, ...(branchId && { branchId }), plannedAt: { gte: today, lt: tomorrow } },
        include: {
          recipe: { include: { ingredients: { include: { product: true } } } },
          branch: { select: { name: true } },
          shift: { select: { shift: true } },
        },
        orderBy: { plannedAt: 'asc' },
      }),
      this.prisma.dailyMinimum.findMany({
        where: { tenantId, active: true, ...(branchId && { branchId }) },
        include: { recipe: { select: { name: true, yieldUnit: true } } },
      }),
    ]);

    // Verifica cuáles mínimos diarios no están cubiertos
    const uncoveredMinimums = minimums.filter(min => {
      const produced = productions
        .filter(p => p.recipeId === min.recipeId && p.status !== 'cancelled')
        .reduce((acc, p) => acc + p.quantity, 0);
      return produced < min.quantity;
    }).map(min => ({
      ...min,
      produced: productions
        .filter(p => p.recipeId === min.recipeId && p.status !== 'cancelled')
        .reduce((acc, p) => acc + p.quantity, 0),
    }));

    return { productions, uncoveredMinimums };
  }

  // ════════════════════════════════════════
  // MERMAS
  // ════════════════════════════════════════

  async findAllWastes(tenantId: string) {
    return this.prisma.waste.findMany({
      where: { tenantId },
      include: {
        product: { select: { name: true } },
        production: { include: { recipe: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createWaste(tenantId: string, data: {
    productionId?: string;
    productId?: string;
    branchId?: string;
    quantity: number;
    unit: string;
    reason: string;
    cost?: number;
    reportedBy?: string;
  }) {
    return this.prisma.waste.create({
      data: {
        tenantId,
        productionId: data.productionId,
        productId: data.productId,
        branchId: data.branchId,
        quantity: data.quantity,
        unit: data.unit,
        reason: data.reason,
        cost: data.cost,
        reportedBy: data.reportedBy,
      },
      include: {
        product: { select: { name: true } },
        production: { include: { recipe: { select: { name: true } } } },
      },
    });
  }

  async getWasteStats(tenantId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalWastes, monthWastes, byReason] = await Promise.all([
      this.prisma.waste.count({ where: { tenantId } }),
      this.prisma.waste.aggregate({
        where: { tenantId, createdAt: { gte: monthStart } },
        _sum: { cost: true },
        _count: { id: true },
      }),
      this.prisma.waste.groupBy({
        by: ['reason'],
        where: { tenantId },
        _count: { id: true },
        _sum: { cost: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      totalWastes,
      monthCount: monthWastes._count.id,
      monthCost: Number(monthWastes._sum.cost ?? 0),
      byReason: byReason.map(r => ({
        reason: r.reason,
        count: r._count.id,
        cost: Number(r._sum.cost ?? 0),
      })),
    };
  }

  // ════════════════════════════════════════
  // ENCARGOS
  // ════════════════════════════════════════

  async findAllEncargos(tenantId: string) {
    return this.prisma.encargo.findMany({
      where: { tenantId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        branch: { select: { name: true } },
        client: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { deliveryDate: 'asc' },
    });
  }

  async createEncargo(tenantId: string, data: {
    clientName: string;
    clientPhone?: string;
    clientId?: string;
    branchId?: string;
    deliveryDate: string;
    deposit?: number;
    notes?: string;
    items: { productId?: string; recipeId?: string; description: string; quantity: number; unit: string; unitPrice: number }[];
  }) {
    const total = data.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    return this.prisma.encargo.create({
      data: {
        tenantId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientId: data.clientId,
        branchId: data.branchId,
        deliveryDate: new Date(data.deliveryDate),
        totalAmount: total,
        deposit: data.deposit ?? 0,
        notes: data.notes,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            recipeId: item.recipeId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    });
  }

  async updateEncargoStatus(tenantId: string, encargoId: string, status: string) {
    const encargo = await this.prisma.encargo.findFirst({ where: { id: encargoId, tenantId } });
    if (!encargo) throw new NotFoundException('Encargo no encontrado');
    return this.prisma.encargo.update({ where: { id: encargoId }, data: { status: status as any } });
  }

  // ════════════════════════════════════════
  // MÍNIMOS DIARIOS
  // ════════════════════════════════════════

  async findAllMinimums(tenantId: string) {
    return this.prisma.dailyMinimum.findMany({
      where: { tenantId, active: true },
      include: { recipe: { select: { name: true, yieldUnit: true } }, branch: { select: { name: true } } },
    });
  }

  async createMinimum(tenantId: string, data: { recipeId: string; quantity: number; shift?: string; branchId?: string }) {
    return this.prisma.dailyMinimum.create({
      data: {
        tenantId,
        recipeId: data.recipeId,
        quantity: data.quantity,
        shift: data.shift as any,
        branchId: data.branchId,
      },
      include: { recipe: { select: { name: true, yieldUnit: true } } },
    });
  }

  async deleteMinimum(tenantId: string, minimumId: string) {
    return this.prisma.dailyMinimum.update({ where: { id: minimumId }, data: { active: false } });
  }

  // ════════════════════════════════════════
  // PROVEEDORES
  // ════════════════════════════════════════

  async findAllSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, active: true },
      include: {
        products: { include: { product: { select: { name: true, sku: true } } } },
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(tenantId: string, data: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxId?: string;
    paymentTerms?: string;
    notes?: string;
  }) {
    return this.prisma.supplier.create({ data: { tenantId, ...data } });
  }

  async updateSupplier(tenantId: string, supplierId: string, data: any) {
    return this.prisma.supplier.update({ where: { id: supplierId }, data });
  }

  // ════════════════════════════════════════
  // ÓRDENES DE COMPRA
  // ════════════════════════════════════════

  async findAllPurchaseOrders(tenantId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: {
        supplier: { select: { name: true } },
        branch: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseOrder(tenantId: string, data: {
    supplierId: string;
    branchId?: string;
    expectedAt?: string;
    notes?: string;
    items: { productId: string; quantity: number; unit: string; unitCost: number }[];
  }) {
    const total = data.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: data.supplierId,
        branchId: data.branchId,
        expectedAt: data.expectedAt ? new Date(data.expectedAt) : undefined,
        notes: data.notes,
        total,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            subtotal: item.quantity * item.unitCost,
          })),
        },
      },
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });
  }

  async receivePurchaseOrder(tenantId: string, orderId: string, items: { itemId: string; receivedQty: number }[]) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    for (const received of items) {
      const item = order.items.find(i => i.id === received.itemId);
      if (!item) continue;

      await this.prisma.purchaseOrderItem.update({
        where: { id: received.itemId },
        data: { receivedQty: received.receivedQty },
      });

      if (order.branchId) {
        const inventory = await this.prisma.inventory.findFirst({
          where: { productId: item.productId, branchId: order.branchId },
        });

        if (inventory) {
          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { increment: Math.floor(received.receivedQty) } },
          });
          await this.prisma.movement.create({
            data: {
              inventoryId: inventory.id,
              type: 'in',
              quantity: Math.floor(received.receivedQty),
              reason: `Recepción de compra #${orderId.slice(-6)}`,
              supplier: order.supplierId,
              unitCost: item.unitCost,
            },
          });
        }
      }
    }

    return this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: 'received', receivedAt: new Date() },
    });
  }

  // ════════════════════════════════════════
  // PRESENTACIONES DE PRODUCTO
  // ════════════════════════════════════════

  async findPresentations(tenantId: string, productId?: string) {
    return this.prisma.productPresentation.findMany({
      where: { tenantId, active: true, ...(productId && { productId }) },
      include: { product: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createPresentation(tenantId: string, data: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
    barcode?: string;
  }) {
    return this.prisma.productPresentation.create({
      data: { tenantId, ...data },
      include: { product: { select: { name: true } } },
    });
  }

  // ════════════════════════════════════════
  // STATS GENERALES
  // ════════════════════════════════════════

  async getProductionStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayProd, monthProd, topRecipes, pending, wasteStats, upcomingEncargos] = await Promise.all([
      this.prisma.production.count({ where: { tenantId, createdAt: { gte: today }, status: 'completed' } }),
      this.prisma.production.count({ where: { tenantId, createdAt: { gte: monthStart }, status: 'completed' } }),
      this.prisma.production.groupBy({
        by: ['recipeId'],
        where: { tenantId, status: 'completed' },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.production.count({ where: { tenantId, status: { in: ['planned', 'in_progress'] } } }),
      this.prisma.waste.aggregate({
        where: { tenantId, createdAt: { gte: monthStart } },
        _sum: { cost: true },
        _count: { id: true },
      }),
      this.prisma.encargo.count({
        where: { tenantId, status: { in: ['pending', 'confirmed', 'in_production'] } },
      }),
    ]);

    const topRecipesWithNames = await Promise.all(
      topRecipes.map(async r => {
        const recipe = await this.prisma.recipe.findUnique({
          where: { id: r.recipeId! },
          select: { name: true, yieldUnit: true },
        });
        return {
          recipeId: r.recipeId,
          name: recipe?.name ?? 'Eliminada',
          yieldUnit: recipe?.yieldUnit,
          totalQuantity: r._sum.quantity ?? 0,
          timesProduced: r._count.id,
        };
      })
    );

    return {
      todayProd,
      monthProd,
      pending,
      wasteCount: wasteStats._count.id,
      wasteCost: Number(wasteStats._sum.cost ?? 0),
      upcomingEncargos,
      topRecipes: topRecipesWithNames,
    };
  }
}