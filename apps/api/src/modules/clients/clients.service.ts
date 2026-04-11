import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Niveles de fidelización ───────────────────────────────────────────────────
const LOYALTY_LEVELS = [
  { key: 'bronze',   label: 'Bronce',   minSpent: 0,      color: '#CD7F32', points: 1  },
  { key: 'silver',   label: 'Plata',    minSpent: 50000,  color: '#C0C0C0', points: 2  },
  { key: 'gold',     label: 'Oro',      minSpent: 150000, color: '#FFD700', points: 3  },
  { key: 'platinum', label: 'Platino',  minSpent: 300000, color: '#E5E4E2', points: 5  },
];

export function getLoyaltyLevel(totalSpent: number) {
  const level = [...LOYALTY_LEVELS].reverse().find(l => totalSpent >= l.minSpent);
  return level ?? LOYALTY_LEVELS[0];
}

export function getNextLevel(totalSpent: number) {
  const current = getLoyaltyLevel(totalSpent);
  const idx     = LOYALTY_LEVELS.findIndex(l => l.key === current.key);
  return LOYALTY_LEVELS[idx + 1] ?? null;
}

// Puntos ganados por venta según nivel
export function calcPoints(amount: number, loyaltyLevel: string): number {
  const level = LOYALTY_LEVELS.find(l => l.key === loyaltyLevel) ?? LOYALTY_LEVELS[0];
  // 1 punto por cada 1000 unidades × multiplicador del nivel
  return Math.floor((amount / 1000) * level.points);
}

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // ── Listar clientes ───────────────────────────────────────────────────────
  async findAll(tenantId: string, filters?: {
    search?:    string;
    active?:    boolean;
    loyalty?:   string;
    page?:      number;
    limit?:     number;
  }) {
    const page  = filters?.page  ?? 1;
    const limit = filters?.limit ?? 30;
    const skip  = (page - 1) * limit;

    const where: any = { tenantId };
    if (filters?.active    !== undefined) where.active       = filters.active;
    if (filters?.loyalty)                 where.loyaltyLevel = filters.loyalty;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { firstName:   { contains: q, mode: 'insensitive' } },
        { lastName:    { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { phone:       { contains: q } },
        { email:       { contains: q, mode: 'insensitive' } },
        { idNumber:    { contains: q } },
        { code:        { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { firstName: 'asc' },
        skip, take: limit,
        include: { _count: { select: { sales: true } } },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Ver un cliente ────────────────────────────────────────────────────────
  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where:   { id, tenantId },
      include: { _count: { select: { sales: true } } },
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
        items:  { include: { product: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
    });

    const stats = await this.prisma.sale.aggregate({
      where:  { tenantId, clientId, status: 'completed' },
      _sum:   { total: true },
      _count: { id: true },
      _avg:   { total: true },
    });

    const level    = getLoyaltyLevel(Number(client.totalSpent));
    const nextLevel = getNextLevel(Number(client.totalSpent));

    return {
      client,
      sales,
      loyalty: {
        current:      level,
        next:         nextLevel,
        totalSpent:   Number(client.totalSpent),
        toNextLevel:  nextLevel ? nextLevel.minSpent - Number(client.totalSpent) : 0,
        progressPct:  nextLevel
          ? Math.min(100, Math.round(((Number(client.totalSpent) - level.minSpent) / (nextLevel.minSpent - level.minSpent)) * 100))
          : 100,
      },
      stats: {
        totalSpent:     Number(stats._sum.total ?? 0),
        totalPurchases: stats._count.id,
        avgTicket:      Number(stats._avg.total ?? 0),
      },
    };
  }

  // ── Crear cliente ─────────────────────────────────────────────────────────
  async create(tenantId: string, data: {
    code?:        string;
    firstName:    string;
    lastName?:    string;
    isCompany?:   boolean;
    companyName?: string;
    phone?:       string;
    email?:       string;
    idNumber?:    string;
    birthDate?:   string;
    address?:     string;
    notes?:       string;
  }) {
    if (data.code) {
      const dup = await this.prisma.client.findFirst({
        where: { tenantId, code: data.code },
      });
      if (dup) throw new BadRequestException('Ya existe un cliente con ese código');
    }
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
        code:        data.code        || null,
        firstName:   data.firstName,
        lastName:    data.lastName,
        isCompany:   data.isCompany   ?? false,
        companyName: data.companyName,
        phone:       data.phone,
        email:       data.email,
        idNumber:    data.idNumber,
        address:     data.address,
        birthDate:   data.birthDate ? new Date(data.birthDate) : undefined,
        notes:       data.notes,
        loyaltyLevel: 'bronze',
      },
    });
  }

  // ── Actualizar cliente ────────────────────────────────────────────────────
  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);

    if (data.code) {
      const dup = await this.prisma.client.findFirst({
        where: { tenantId, code: data.code, id: { not: id } },
      });
      if (dup) throw new BadRequestException('Ya existe un cliente con ese código');
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        ...(data.code        !== undefined && { code:        data.code || null  }),
        ...(data.firstName   !== undefined && { firstName:   data.firstName     }),
        ...(data.lastName    !== undefined && { lastName:    data.lastName      }),
        ...(data.isCompany   !== undefined && { isCompany:   data.isCompany     }),
        ...(data.companyName !== undefined && { companyName: data.companyName   }),
        ...(data.phone       !== undefined && { phone:       data.phone         }),
        ...(data.email       !== undefined && { email:       data.email         }),
        ...(data.idNumber    !== undefined && { idNumber:    data.idNumber      }),
        ...(data.address     !== undefined && { address:     data.address       }),
        ...(data.notes       !== undefined && { notes:       data.notes         }),
        ...(data.active      !== undefined && { active:      data.active        }),
        ...(data.birthDate   !== undefined && { birthDate:   data.birthDate ? new Date(data.birthDate) : null }),
      },
    });
  }

  // ── Eliminar cliente ──────────────────────────────────────────────────────
  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.sale.updateMany({
      where: { tenantId, clientId: id },
      data:  { clientId: null },
    });
    return this.prisma.client.delete({ where: { id } });
  }

  // ── Fiado: agregar ────────────────────────────────────────────────────────
  async addCredit(tenantId: string, id: string, amount: number) {
    await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data:  { creditBalance: { increment: amount } },
    });
  }

  // ── Fiado: pagar ──────────────────────────────────────────────────────────
  async payCredit(tenantId: string, id: string, amount: number) {
    const client = await this.findOne(tenantId, id);
    const current = Number(client.creditBalance);
    if (amount > current) throw new BadRequestException(`El monto supera la deuda actual`);
    return this.prisma.client.update({
      where: { id },
      data:  { creditBalance: { decrement: amount } },
    });
  }

  // ── Puntos: agregar manualmente ───────────────────────────────────────────
  async addPoints(tenantId: string, id: string, points: number, notes?: string) {
    await this.findOne(tenantId, id);
    const updated = await this.prisma.client.update({
      where: { id },
      data:  { points: { increment: points } },
    });
    return updated;
  }

  // ── Puntos: canjear ───────────────────────────────────────────────────────
  async redeemPoints(tenantId: string, id: string, points: number) {
    const client = await this.findOne(tenantId, id);
    if (points > client.points) throw new BadRequestException('Puntos insuficientes');
    return this.prisma.client.update({
      where: { id },
      data:  { points: { decrement: points } },
    });
  }

  // ── Buscar por teléfono o código (para POS) ───────────────────────────────
  async findByPhone(tenantId: string, phone: string) {
    return this.prisma.client.findFirst({
      where:   { tenantId, phone, active: true },
      include: { _count: { select: { sales: true } } },
    });
  }

  async findByCode(tenantId: string, code: string) {
    return this.prisma.client.findFirst({
      where:   { tenantId, code, active: true },
      include: { _count: { select: { sales: true } } },
    });
  }

  // ── Stats globales ────────────────────────────────────────────────────────
  async getStats(tenantId: string) {
    const [total, active, withDebt, byLevel] = await Promise.all([
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId, active: true } }),
      this.prisma.client.count({ where: { tenantId, creditBalance: { gt: 0 } } }),
      this.prisma.client.groupBy({
        by:    ['loyaltyLevel'],
        where: { tenantId },
        _count: { id: true },
      }),
    ]);

    const debtTotal = await this.prisma.client.aggregate({
      where: { tenantId, creditBalance: { gt: 0 } },
      _sum:  { creditBalance: true },
    });

    const topClients = await this.prisma.client.findMany({
      where:   { tenantId },
      orderBy: { totalSpent: 'desc' },
      take:    5,
      include: { _count: { select: { sales: true } } },
    });

    return {
      total,
      active,
      withDebt,
      totalDebt:  Number(debtTotal._sum.creditBalance ?? 0),
      byLevel,
      topClients,
    };
  }

  // ── Actualizar nivel de fidelización tras venta ───────────────────────────
  async updateAfterSale(tenantId: string, clientId: string, saleAmount: number) {
    const client = await this.findOne(tenantId, clientId);
    const newTotal   = Number(client.totalSpent) + saleAmount;
    const newLevel   = getLoyaltyLevel(newTotal);
    const newPoints  = client.points + calcPoints(saleAmount, newLevel.key);

    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        totalSpent:   newTotal,
        loyaltyLevel: newLevel.key,
        points:       newPoints,
      },
    });
  }
}
