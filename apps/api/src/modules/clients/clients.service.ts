import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // ── Listar clientes ───────────────────────────────────────────────────────
  async findAll(tenantId: string, filters?: {
    search?: string;
    active?: boolean;
    page?:   number;
    limit?:  number;
  }) {
    const page  = filters?.page  ?? 1;
    const limit = filters?.limit ?? 30;
    const skip  = (page - 1) * limit;

    const where: any = { tenantId };
    if (filters?.active !== undefined) where.active = filters.active;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName:  { contains: q, mode: 'insensitive' } },
        { phone:     { contains: q } },
        { email:     { contains: q, mode: 'insensitive' } },
        { idNumber:  { contains: q } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { firstName: 'asc' },
        skip,
        take: limit,
        include: {
          _count: { select: { sales: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Ver un cliente ────────────────────────────────────────────────────────
  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where:   { id, tenantId },
      include: {
        _count: { select: { sales: true } },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  // ── Historial de compras ──────────────────────────────────────────────────
  async getSaleHistory(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const sales = await this.prisma.sale.findMany({
      where:   { tenantId, clientId },
      orderBy: { createdAt: 'desc' },
      take:    50,
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
        branch: { select: { name: true } },
      },
    });

    const stats = await this.prisma.sale.aggregate({
      where: { tenantId, clientId, status: 'completed' },
      _sum:   { total: true },
      _count: { id: true },
      _avg:   { total: true },
    });

    return {
      client,
      sales,
      stats: {
        totalSpent:    Number(stats._sum.total  ?? 0),
        totalPurchases: stats._count.id,
        avgTicket:     Number(stats._avg.total  ?? 0),
      },
    };
  }

  // ── Crear cliente ─────────────────────────────────────────────────────────
  async create(tenantId: string, data: {
    firstName:  string;
    lastName?:  string;
    phone?:     string;
    email?:     string;
    idNumber?:  string;
    birthDate?: string;
    notes?:     string;
  }) {
    // Verifica duplicado por teléfono o email
    if (data.phone) {
      const dup = await this.prisma.client.findFirst({
        where: { tenantId, phone: data.phone },
      });
      if (dup) throw new BadRequestException('Ya existe un cliente con ese teléfono');
    }
    if (data.email) {
      const dup = await this.prisma.client.findFirst({
        where: { tenantId, email: data.email },
      });
      if (dup) throw new BadRequestException('Ya existe un cliente con ese correo');
    }

    return this.prisma.client.create({
      data: {
        tenantId,
        firstName:  data.firstName,
        lastName:   data.lastName,
        phone:      data.phone,
        email:      data.email,
        idNumber:   data.idNumber,
        birthDate:  data.birthDate ? new Date(data.birthDate) : undefined,
        notes:      data.notes,
      },
    });
  }

  // ── Actualizar cliente ────────────────────────────────────────────────────
  async update(tenantId: string, id: string, data: {
    firstName?:  string;
    lastName?:   string;
    phone?:      string;
    email?:      string;
    idNumber?:   string;
    birthDate?:  string;
    notes?:      string;
    active?:     boolean;
  }) {
    await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data: {
        ...(data.firstName  !== undefined && { firstName:  data.firstName  }),
        ...(data.lastName   !== undefined && { lastName:   data.lastName   }),
        ...(data.phone      !== undefined && { phone:      data.phone      }),
        ...(data.email      !== undefined && { email:      data.email      }),
        ...(data.idNumber   !== undefined && { idNumber:   data.idNumber   }),
        ...(data.notes      !== undefined && { notes:      data.notes      }),
        ...(data.active     !== undefined && { active:     data.active     }),
        ...(data.birthDate  !== undefined && { birthDate:  data.birthDate ? new Date(data.birthDate) : null }),
      },
    });
  }

  // ── Eliminar cliente ──────────────────────────────────────────────────────
  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    // Desvincula ventas antes de eliminar
    await this.prisma.sale.updateMany({
      where: { tenantId, clientId: id },
      data:  { clientId: null },
    });
    return this.prisma.client.delete({ where: { id } });
  }

  // ── Fiado: agregar saldo ──────────────────────────────────────────────────
  async addCredit(tenantId: string, id: string, amount: number, notes?: string) {
    const client = await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data:  { creditBalance: { increment: amount } },
    });
  }

  // ── Fiado: pagar deuda ────────────────────────────────────────────────────
  async payCredit(tenantId: string, id: string, amount: number) {
    const client = await this.findOne(tenantId, id);
    const current = Number(client.creditBalance);
    if (amount > current) throw new BadRequestException(`El monto supera la deuda actual (${current})`);
    return this.prisma.client.update({
      where: { id },
      data:  { creditBalance: { decrement: amount } },
    });
  }

  // ── Buscar por teléfono (para POS) ────────────────────────────────────────
  async findByPhone(tenantId: string, phone: string) {
    return this.prisma.client.findFirst({
      where:   { tenantId, phone, active: true },
      include: { _count: { select: { sales: true } } },
    });
  }

  // ── Stats globales ────────────────────────────────────────────────────────
  async getStats(tenantId: string) {
    const [total, active, withDebt, topClients] = await Promise.all([
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId, active: true } }),
      this.prisma.client.count({ where: { tenantId, creditBalance: { gt: 0 } } }),
      this.prisma.client.findMany({
        where:   { tenantId },
        orderBy: { sales: { _count: 'desc' } },
        take:    5,
        include: { _count: { select: { sales: true } } },
      }),
    ]);

    const debtTotal = await this.prisma.client.aggregate({
      where: { tenantId, creditBalance: { gt: 0 } },
      _sum:  { creditBalance: true },
    });

    return {
      total,
      active,
      withDebt,
      totalDebt: Number(debtTotal._sum.creditBalance ?? 0),
      topClients,
    };
  }
}
