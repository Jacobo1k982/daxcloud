import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) { }

  // ════════════════════════════════════════
  // MESAS
  // ════════════════════════════════════════

  async findAllTables(tenantId: string, branchId?: string) {
    return this.prisma.table.findMany({
      where: { tenantId, active: true, ...(branchId && { branchId }) },
      include: {
        branch: { select: { name: true } },
        orders: {
          where: { status: { notIn: ['completed', 'cancelled'] } },
          include: {
            items: { include: { product: { select: { name: true, price: true } }, modifiers: { include: { option: true } } } },
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        reservations: {
          where: {
            status: { in: ['confirmed', 'pending'] },
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ section: 'asc' }, { number: 'asc' }],
    });
  }

  async createTable(tenantId: string, data: any) {
    const existing = await this.prisma.table.findFirst({
      where: { tenantId, number: data.number, branchId: data.branchId },
    });
    if (existing) throw new BadRequestException(`La mesa ${data.number} ya existe`);
    return this.prisma.table.create({ data: { tenantId, ...data } });
  }

  async updateTable(tenantId: string, tableId: string, data: any) {
    const table = await this.prisma.table.findFirst({ where: { id: tableId, tenantId } });
    if (!table) throw new NotFoundException('Mesa no encontrada');
    return this.prisma.table.update({ where: { id: tableId }, data });
  }

  async updateTableStatus(tenantId: string, tableId: string, status: string) {
    const table = await this.prisma.table.findFirst({ where: { id: tableId, tenantId } });
    if (!table) throw new NotFoundException('Mesa no encontrada');
    return this.prisma.table.update({ where: { id: tableId }, data: { status } });
  }

  // ════════════════════════════════════════
  // MODIFICADORES
  // ════════════════════════════════════════

  async findAllModifierGroups(tenantId: string) {
    return this.prisma.menuModifierGroup.findMany({
      where: { tenantId, active: true },
      include: {
        options: { where: { active: true } },
        products: { include: { product: { select: { name: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createModifierGroup(tenantId: string, data: {
    name: string;
    description?: string;
    required?: boolean;
    multiple?: boolean;
    minSelect?: number;
    maxSelect?: number;
    options: { name: string; extraPrice?: number }[];
  }) {
    return this.prisma.menuModifierGroup.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        required: data.required ?? false,
        multiple: data.multiple ?? false,
        minSelect: data.minSelect ?? 0,
        maxSelect: data.maxSelect ?? 1,
        options: { create: data.options.map(o => ({ name: o.name, extraPrice: o.extraPrice ?? 0 })) },
      },
      include: { options: true },
    });
  }

  async updateModifierGroup(tenantId: string, groupId: string, data: any) {
    const group = await this.prisma.menuModifierGroup.findFirst({ where: { id: groupId, tenantId } });
    if (!group) throw new NotFoundException('Grupo de modificadores no encontrado');
    return this.prisma.menuModifierGroup.update({ where: { id: groupId }, data });
  }

  async deleteModifierGroup(tenantId: string, groupId: string) {
    const group = await this.prisma.menuModifierGroup.findFirst({ where: { id: groupId, tenantId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return this.prisma.menuModifierGroup.update({ where: { id: groupId }, data: { active: false } });
  }

  async assignModifierToProduct(tenantId: string, productId: string, groupId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    const group = await this.prisma.menuModifierGroup.findFirst({ where: { id: groupId, tenantId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    return this.prisma.productModifierGroup.upsert({
      where: { productId_groupId: { productId, groupId } },
      create: { productId, groupId },
      update: {},
    });
  }

  async removeModifierFromProduct(tenantId: string, productId: string, groupId: string) {
    return this.prisma.productModifierGroup.deleteMany({ where: { productId, groupId } });
  }

  // ════════════════════════════════════════
  // COMBOS Y MENÚS DEL DÍA
  // ════════════════════════════════════════

  async findAllCombos(tenantId: string) {
    return this.prisma.combo.findMany({
      where: { tenantId, active: true },
      include: {
        items: { include: { product: { select: { name: true, price: true, imageUrl: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAvailableCombos(tenantId: string) {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const dayOfWeek = now.getDay().toString();

    const combos = await this.prisma.combo.findMany({
      where: { tenantId, active: true, available: true },
      include: {
        items: { include: { product: { select: { name: true, price: true, imageUrl: true } } } },
      },
    });

    return combos.filter(combo => {
      if (combo.daysOfWeek && !combo.daysOfWeek.includes(dayOfWeek)) return false;
      if (combo.availableFrom && timeStr < combo.availableFrom) return false;
      if (combo.availableTo && timeStr > combo.availableTo) return false;
      return true;
    });
  }

  async createCombo(tenantId: string, data: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    availableFrom?: string;
    availableTo?: string;
    daysOfWeek?: string;
    items: { productId: string; quantity: number; notes?: string }[];
  }) {
    for (const item of data.items) {
      const product = await this.prisma.product.findFirst({ where: { id: item.productId, tenantId } });
      if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
    }

    return this.prisma.combo.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        availableFrom: data.availableFrom,
        availableTo: data.availableTo,
        daysOfWeek: data.daysOfWeek,
        items: { create: data.items.map(i => ({ productId: i.productId, quantity: i.quantity, notes: i.notes })) },
      },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
  }

  async updateCombo(tenantId: string, comboId: string, data: any) {
    const combo = await this.prisma.combo.findFirst({ where: { id: comboId, tenantId } });
    if (!combo) throw new NotFoundException('Combo no encontrado');
    return this.prisma.combo.update({ where: { id: comboId }, data });
  }

  async deleteCombo(tenantId: string, comboId: string) {
    const combo = await this.prisma.combo.findFirst({ where: { id: comboId, tenantId } });
    if (!combo) throw new NotFoundException('Combo no encontrado');
    return this.prisma.combo.update({ where: { id: comboId }, data: { active: false } });
  }

  // ════════════════════════════════════════
  // RESERVACIONES
  // ════════════════════════════════════════

  async findAllReservations(tenantId: string, date?: string) {
    const filterDate = date ? new Date(date) : new Date();
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        date: { gte: filterDate, lt: nextDay },
      },
      include: {
        table: { select: { number: true, name: true, section: true, capacity: true } },
        client: { select: { firstName: true, lastName: true, phone: true } },
        branch: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findUpcomingReservations(tenantId: string) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        date: { gte: now, lte: in7Days },
        status: { in: ['pending', 'confirmed'] },
      },
      include: {
        table: { select: { number: true, name: true, capacity: true } },
        client: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async createReservation(tenantId: string, data: {
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    clientId?: string;
    tableId?: string;
    branchId?: string;
    partySize: number;
    date: string;
    duration?: number;
    notes?: string;
    source?: string;
  }) {
    // Verifica disponibilidad de la mesa
    if (data.tableId) {
      const reservationDate = new Date(data.date);
      const endTime = new Date(reservationDate.getTime() + (data.duration ?? 90) * 60 * 1000);

      const conflict = await this.prisma.reservation.findFirst({
        where: {
          tenantId,
          tableId: data.tableId,
          status: { in: ['confirmed', 'pending'] },
          OR: [
            { date: { gte: reservationDate, lt: endTime } },
            {
              date: { lt: reservationDate },
              AND: [{ date: { gte: new Date(reservationDate.getTime() - (data.duration ?? 90) * 60 * 1000) } }],
            },
          ],
        },
      });
      if (conflict) throw new BadRequestException('La mesa ya tiene una reservación en ese horario');
    }

    return this.prisma.reservation.create({
      data: {
        tenantId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        clientId: data.clientId,
        tableId: data.tableId,
        branchId: data.branchId,
        partySize: data.partySize,
        date: new Date(data.date),
        duration: data.duration ?? 90,
        notes: data.notes,
        source: data.source ?? 'direct',
        status: 'pending',
      },
      include: {
        table: { select: { number: true, name: true } },
      },
    });
  }

  async updateReservationStatus(tenantId: string, reservationId: string, status: string) {
    const reservation = await this.prisma.reservation.findFirst({ where: { id: reservationId, tenantId } });
    if (!reservation) throw new NotFoundException('Reservación no encontrada');

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
    });

    // Si se confirma la reservación, marca la mesa como reservada
    if (status === 'confirmed' && reservation.tableId) {
      await this.prisma.table.update({ where: { id: reservation.tableId }, data: { status: 'reserved' } });
    }

    // Si se cancela, libera la mesa
    if (status === 'cancelled' && reservation.tableId) {
      await this.prisma.table.update({ where: { id: reservation.tableId }, data: { status: 'available' } });
    }

    return updated;
  }

  async updateReservation(tenantId: string, reservationId: string, data: any) {
    const reservation = await this.prisma.reservation.findFirst({ where: { id: reservationId, tenantId } });
    if (!reservation) throw new NotFoundException('Reservación no encontrada');
    return this.prisma.reservation.update({ where: { id: reservationId }, data });
  }

  // ════════════════════════════════════════
  // ÓRDENES COMPLETAS
  // ════════════════════════════════════════

  async findAllOrders(tenantId: string, status?: string, branchId?: string) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        ...(status && { status: status as any }),
        ...(branchId && { branchId }),
      },
      include: {
        table: { select: { number: true, name: true, section: true } },
        user: { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, price: true, imageUrl: true } },
            modifiers: { include: { option: { select: { name: true, extraPrice: true } } } },
          },
          orderBy: { status: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOneOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        table: { select: { number: true, name: true, section: true } },
        user: { select: { firstName: true, lastName: true } },
        items: {
          include: {
            product: true,
            modifiers: { include: { option: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async createOrder(tenantId: string, userId: string, data: {
    tableId?: string;
    branchId?: string;
    notes?: string;
    isDelivery?: boolean;
    deliveryAddress?: string;
    deliveryPhone?: string;
    deliveryFee?: number;
    items?: { productId: string; quantity: number; notes?: string; modifiers?: string[] }[];
  }) {
    if (data.tableId) {
      const table = await this.prisma.table.findFirst({ where: { id: data.tableId, tenantId } });
      if (!table) throw new NotFoundException('Mesa no encontrada');
    }

    let total = 0;
    const itemsData = [];

    if (data.items?.length) {
      for (const item of data.items) {
        const product = await this.prisma.product.findFirst({ where: { id: item.productId, tenantId } });
        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);

        let itemPrice = Number(product.price);
        const modifiersData = [];

        if (item.modifiers?.length) {
          for (const optionId of item.modifiers) {
            const option = await this.prisma.menuModifierOption.findUnique({ where: { id: optionId } });
            if (option) {
              itemPrice += Number(option.extraPrice);
              modifiersData.push({ optionId, extraPrice: Number(option.extraPrice) });
            }
          }
        }

        total += itemPrice * item.quantity;
        itemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: itemPrice,
          notes: item.notes,
          status: 'pending',
          modifiers: { create: modifiersData },
        });
      }
    }

    if (data.isDelivery && data.deliveryFee) total += data.deliveryFee;

    const order = await this.prisma.order.create({
      data: {
        tenantId,
        userId,
        tableId: data.tableId,
        branchId: data.branchId,
        notes: data.notes,
        total,
        status: 'open',
        items: { create: itemsData },
      },
      include: {
        table: { select: { number: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, price: true } },
            modifiers: { include: { option: true } },
          },
        },
      },
    });

    if (data.tableId) {
      await this.prisma.table.update({ where: { id: data.tableId }, data: { status: 'occupied' } });
    }

    if (data.isDelivery && data.deliveryAddress) {
      await this.prisma.deliveryOrder.create({
        data: {
          tenantId,
          orderId: order.id,
          clientName: 'Cliente',
          clientPhone: data.deliveryPhone,
          address: data.deliveryAddress,
          deliveryFee: data.deliveryFee ?? 0,
          status: 'pending',
        },
      });
    }

    return order;
  }

  async addItemsToOrder(tenantId: string, orderId: string, items: { productId: string; quantity: number; notes?: string; modifiers?: string[] }[]) {
    const order = await this.findOneOrder(tenantId, orderId);
    if (['completed', 'cancelled'].includes(order.status)) throw new BadRequestException('No se puede modificar una orden cerrada');

    let additionalTotal = 0;
    const itemsData = [];

    for (const item of items) {
      const product = await this.prisma.product.findFirst({ where: { id: item.productId, tenantId } });
      if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);

      let itemPrice = Number(product.price);
      const modifiersData = [];

      if (item.modifiers?.length) {
        for (const optionId of item.modifiers) {
          const option = await this.prisma.menuModifierOption.findUnique({ where: { id: optionId } });
          if (option) {
            itemPrice += Number(option.extraPrice);
            modifiersData.push({ optionId, extraPrice: Number(option.extraPrice) });
          }
        }
      }

      additionalTotal += itemPrice * item.quantity;
      itemsData.push({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        notes: item.notes,
        status: 'pending',
      });
    }

    for (const item of itemsData) {
      await this.prisma.orderItem.create({ data: item });
    }

    await this.prisma.order.update({ where: { id: orderId }, data: { total: { increment: additionalTotal } } });
    return this.findOneOrder(tenantId, orderId);
  }

  async updateOrderStatus(tenantId: string, orderId: string, status: string) {
    const order = await this.findOneOrder(tenantId, orderId);
    const validStatuses = ['open', 'in_progress', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) throw new BadRequestException('Estado inválido');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: { table: true },
    });

    if (['completed', 'cancelled'].includes(status) && updated.tableId) {
      await this.prisma.table.update({ where: { id: updated.tableId }, data: { status: 'available' } });
    }

    return updated;
  }

  async updateItemStatus(tenantId: string, orderId: string, itemId: string, status: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const updated = await this.prisma.orderItem.update({ where: { id: itemId }, data: { status } });

    const pendingItems = await this.prisma.orderItem.count({
      where: { orderId, status: { in: ['pending', 'preparing'] } },
    });

    if (pendingItems === 0 && status === 'ready') {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'ready' } });
    }

    return updated;
  }

  // ════════════════════════════════════════
  // PAGOS Y PROPINAS
  // ════════════════════════════════════════

  async splitPayment(tenantId: string, orderId: string, payments: {
    amount: number;
    tip?: number;
    paymentMethod: string;
    guestName?: string;
    reference?: string;
  }[]) {
    const order = await this.findOneOrder(tenantId, orderId);
    if (order.status === 'completed') throw new BadRequestException('La orden ya está cerrada');

    const totalPayments = payments.reduce((acc, p) => acc + p.amount + (p.tip ?? 0), 0);
    const orderTotal = Number(order.total);

    if (totalPayments < orderTotal) throw new BadRequestException(`El pago total (${totalPayments}) es menor al total de la orden (${orderTotal})`);

    const createdPayments = [];
    for (const payment of payments) {
      const created = await this.prisma.orderPayment.create({
        data: {
          orderId,
          amount: payment.amount,
          tip: payment.tip ?? 0,
          paymentMethod: payment.paymentMethod,
          guestName: payment.guestName,
          reference: payment.reference,
        },
      });
      createdPayments.push(created);
    }

    return createdPayments;
  }

  async closeOrder(tenantId: string, orderId: string, paymentMethod: string, tip = 0) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        table: { select: { number: true } },
        items: true,
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status === 'completed') throw new BadRequestException('La orden ya está cerrada');

    const sale = await this.prisma.sale.create({
      data: {
        tenantId,
        branchId: order.branchId!,
        userId: order.userId,
        subtotal: order.total,
        total: Number(order.total) + tip,
        discount: 0,
        tax: 0,
        paymentMethod: paymentMethod as any,
        status: 'completed',
        notes: `Orden ${order.table ? `mesa ${order.table.number}` : 'sin mesa'}${tip > 0 ? ` · Propina: ${tip}` : ''}`,
        items: {
          create: order.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: Number(item.price) * item.quantity,
            discount: 0,
          })),
        },
      },
    });

    const existingPayments = await this.prisma.orderPayment.count({ where: { orderId } });
    if (existingPayments === 0) {
      await this.prisma.orderPayment.create({
        data: { orderId, amount: Number(order.total), tip, paymentMethod },
      });
    }

    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'completed' } });
    if (order.tableId) {
      await this.prisma.table.update({ where: { id: order.tableId }, data: { status: 'available' } });
    }

    return { sale, order: { ...order, status: 'completed' } };
  }
  // ════════════════════════════════════════
  // ESTACIONES DE COCINA
  // ════════════════════════════════════════

  async findAllStations(tenantId: string) {
    return this.prisma.kitchenStation.findMany({
      where: { tenantId, active: true },
      include: {
        products: { include: { product: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
    });
  }

  async createStation(tenantId: string, data: {
    name: string;
    description?: string;
    color?: string;
    branchId?: string;
  }) {
    return this.prisma.kitchenStation.create({ data: { tenantId, ...data } });
  }

  async assignProductToStation(tenantId: string, stationId: string, productId: string) {
    return this.prisma.stationProduct.upsert({
      where: { stationId_productId: { stationId, productId } },
      create: { stationId, productId },
      update: {},
    });
  }

  // ════════════════════════════════════════
  // KDS AVANZADO
  // ════════════════════════════════════════

  async getKitchenOrders(tenantId: string, branchId?: string, stationId?: string) {
    const stations = stationId
      ? [await this.prisma.kitchenStation.findUnique({ where: { id: stationId }, include: { products: true } })]
      : await this.prisma.kitchenStation.findMany({ where: { tenantId, active: true }, include: { products: true } });

    const stationProductIds = stations.flatMap(s => s?.products.map(p => p.productId) ?? []);

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['open', 'in_progress'] },
        ...(branchId && { branchId }),
        items: {
          some: {
            status: { in: ['pending', 'preparing'] },
            ...(stationProductIds.length > 0 && { productId: { in: stationProductIds } }),
          },
        },
      },
      include: {
        table: { select: { number: true, name: true, section: true } },
        user: { select: { firstName: true } },
        items: {
          where: {
            status: { in: ['pending', 'preparing', 'ready'] },
            ...(stationProductIds.length > 0 && { productId: { in: stationProductIds } }),
          },
          include: {
            product: { select: { name: true, imageUrl: true } },
            modifiers: { include: { option: { select: { name: true } } } },
          },
          orderBy: { status: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agrega tiempo transcurrido y urgencia
    return orders.map(order => ({
      ...order,
      elapsedMinutes: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000),
      isUrgent: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000) > 20,
    }));
  }

  // ════════════════════════════════════════
  // DELIVERY
  // ════════════════════════════════════════

  async findAllDeliveryOrders(tenantId: string, status?: string) {
    return this.prisma.deliveryOrder.findMany({
      where: { tenantId, ...(status && { status }) },
      include: {
        order: {
          include: {
            items: { include: { product: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDeliveryStatus(tenantId: string, deliveryId: string, status: string) {
    const delivery = await this.prisma.deliveryOrder.findFirst({ where: { id: deliveryId, tenantId } });
    if (!delivery) throw new NotFoundException('Delivery no encontrado');

    const data: any = { status };
    if (status === 'delivered') data.deliveredAt = new Date();

    return this.prisma.deliveryOrder.update({ where: { id: deliveryId }, data });
  }

  // ════════════════════════════════════════
  // CIERRE DE CAJA
  // ════════════════════════════════════════

  async openRegisterShift(tenantId: string, userId: string, data: {
    openingAmount: number;
    branchId?: string;
    notes?: string;
  }) {
    const existing = await this.prisma.cashRegisterShift.findFirst({
      where: { tenantId, userId, status: 'open' },
    });
    if (existing) throw new BadRequestException('Ya tienes un turno abierto');

    return this.prisma.cashRegisterShift.create({
      data: {
        tenantId,
        userId,
        branchId: data.branchId,
        openingAmount: data.openingAmount,
        notes: data.notes,
        status: 'open',
      },
    });
  }

  async closeRegisterShift(tenantId: string, userId: string, data: {
    closingAmount: number;
    notes?: string;
  }) {
    const shift = await this.prisma.cashRegisterShift.findFirst({
      where: { tenantId, userId, status: 'open' },
    });
    if (!shift) throw new NotFoundException('No hay turno abierto');

    const sales = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        branchId: shift.branchId ?? undefined,
        createdAt: { gte: shift.openedAt },
        status: 'completed',
      },
      _sum: { total: true },
      _count: { id: true },
    });

    const tips = await this.prisma.orderPayment.aggregate({
      where: {
        order: { tenantId, branchId: shift.branchId ?? undefined },
        createdAt: { gte: shift.openedAt },
      },
      _sum: { tip: true },
    });

    const totalSales = Number(sales._sum.total ?? 0);
    const totalTips = Number(tips._sum.tip ?? 0);
    const expectedAmount = Number(shift.openingAmount) + totalSales;
    const difference = data.closingAmount - expectedAmount;

    return this.prisma.cashRegisterShift.update({
      where: { id: shift.id },
      data: {
        closingAmount: data.closingAmount,
        expectedAmount,
        difference,
        totalSales,
        totalOrders: sales._count.id,
        totalTips,
        notes: data.notes,
        status: 'closed',
        closedAt: new Date(),
      },
    });
  }

  async getRegisterShifts(tenantId: string) {
    return this.prisma.cashRegisterShift.findMany({
      where: { tenantId },
      include: { user: { select: { firstName: true, lastName: true } }, branch: { select: { name: true } } },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });
  }

  // ════════════════════════════════════════
  // HAPPY HOUR
  // ════════════════════════════════════════

  async findAllHappyHours(tenantId: string) {
    return this.prisma.happyHour.findMany({
      where: { tenantId, active: true },
      include: {
        products: { include: { product: { select: { name: true, price: true } } } },
      },
    });
  }

  async getActiveHappyHour(tenantId: string) {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const dayOfWeek = now.getDay().toString();

    const happyHours = await this.prisma.happyHour.findMany({
      where: { tenantId, active: true },
      include: { products: { include: { product: { select: { id: true, name: true, price: true } } } } },
    });

    return happyHours.filter(hh => {
      if (!hh.daysOfWeek.includes(dayOfWeek)) return false;
      return timeStr >= hh.startTime && timeStr <= hh.endTime;
    });
  }

  async createHappyHour(tenantId: string, data: {
    name: string;
    discount: number;
    discountType?: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string;
    productIds?: string[];
  }) {
    return this.prisma.happyHour.create({
      data: {
        tenantId,
        name: data.name,
        discount: data.discount,
        discountType: data.discountType ?? 'percentage',
        startTime: data.startTime,
        endTime: data.endTime,
        daysOfWeek: data.daysOfWeek,
        products: data.productIds?.length
          ? { create: data.productIds.map(pid => ({ productId: pid })) }
          : undefined,
      },
      include: { products: { include: { product: { select: { name: true } } } } },
    });
  }

  // ════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      tablesTotal, tablesOccupied, tablesAvailable,
      activeOrders, ordersReady,
      todaySales, monthSales,
      todayReservations, pendingDeliveries,
      openShift,
    ] = await Promise.all([
      this.prisma.table.count({ where: { tenantId, active: true } }),
      this.prisma.table.count({ where: { tenantId, status: 'occupied' } }),
      this.prisma.table.count({ where: { tenantId, status: 'available' } }),
      this.prisma.order.count({ where: { tenantId, status: { in: ['open', 'in_progress'] } } }),
      this.prisma.order.count({ where: { tenantId, status: 'ready' } }),
      this.prisma.sale.aggregate({
        where: { tenantId, status: 'completed', createdAt: { gte: today } },
        _sum: { total: true }, _count: { id: true },
      }),
      this.prisma.sale.aggregate({
        where: { tenantId, status: 'completed', createdAt: { gte: monthStart } },
        _sum: { total: true }, _count: { id: true },
      }),
      this.prisma.reservation.count({ where: { tenantId, date: { gte: today, lt: new Date(today.getTime() + 86400000) }, status: { in: ['confirmed', 'pending'] } } }),
      this.prisma.deliveryOrder.count({ where: { tenantId, status: { in: ['pending', 'preparing', 'out_for_delivery'] } } }),
      this.prisma.cashRegisterShift.findFirst({ where: { tenantId, status: 'open' }, include: { user: { select: { firstName: true } } } }),
    ]);

    const todayTips = await this.prisma.orderPayment.aggregate({
      where: { order: { tenantId }, createdAt: { gte: today } },
      _sum: { tip: true },
    });

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { tenantId, status: 'completed', createdAt: { gte: monthStart } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductsWithNames = await Promise.all(
      topProducts.map(async p => {
        const product = await this.prisma.product.findUnique({ where: { id: p.productId }, select: { name: true } });
        return { productId: p.productId, name: product?.name ?? '—', quantity: p._sum.quantity ?? 0 };
      })
    );

    const avgOrders = await this.prisma.order.findMany({
      where: { tenantId, status: 'completed', createdAt: { gte: today } },
      select: { createdAt: true, updatedAt: true },
    });

    const avgTime = avgOrders.length > 0
      ? avgOrders.reduce((acc, o) => acc + (o.updatedAt.getTime() - o.createdAt.getTime()), 0) / avgOrders.length / 60000
      : 0;

    return {
      tablesTotal, tablesOccupied, tablesAvailable,
      activeOrders, ordersReady,
      todayRevenue: Number(todaySales._sum.total ?? 0),
      todayOrdersCount: todaySales._count.id,
      todayTips: Number(todayTips._sum.tip ?? 0),
      monthRevenue: Number(monthSales._sum.total ?? 0),
      monthOrdersCount: monthSales._count.id,
      todayReservations,
      pendingDeliveries,
      openShift,
      avgOrderTime: Math.round(avgTime),
      topProducts: topProductsWithNames,
    };
  }
}