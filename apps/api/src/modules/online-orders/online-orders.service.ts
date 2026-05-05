import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class OnlineOrdersService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsGateway,
    ) { }

    // Generar número de orden único
    private async generateOrderNumber(tenantId: string): Promise<string> {
        const count = await this.prisma.onlineOrder.count({ where: { tenantId } });
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        return `ORD-${date}-${String(count + 1).padStart(4, '0')}`;
    }

    // ── PÚBLICO — obtener catálogo ──────────────────────────────────────────
    async getPublicCatalog(slug: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            select: { id: true, name: true, logoUrl: true, industry: true, address: true, phone: true, active: true },
        });
        if (!tenant || !tenant.active) throw new NotFoundException('Negocio no encontrado');

        const products = await this.prisma.product.findMany({
            where: { tenantId: tenant.id, active: true },
            select: { id: true, name: true, price: true, description: true, imageUrl: true, category: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });

        const branches = await this.prisma.branch.findMany({
            where: { tenantId: tenant.id, active: true },
            select: { id: true, name: true, address: true, phone: true },
        });

        return { tenant, products, branches };
    }

    // ── PÚBLICO — crear pedido ──────────────────────────────────────────────
    async createPublicOrder(slug: string, dto: {
        branchId?: string;
        type: 'pickup' | 'delivery';
        customerName: string;
        customerPhone: string;
        customerAddress?: string;
        notes?: string;
        items: { productId: string; name: string; price: number; quantity: number }[];
    }) {
        const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
        if (!tenant || !tenant.active) throw new NotFoundException('Negocio no encontrado');

        const subtotal = dto.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
        const orderNumber = await this.generateOrderNumber(tenant.id);

        const order = await this.prisma.onlineOrder.create({
            data: {
                tenantId: tenant.id,
                branchId: dto.branchId ?? null,
                orderNumber,
                status: 'new',
                type: dto.type,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                customerAddress: dto.customerAddress ?? null,
                notes: dto.notes ?? null,
                items: dto.items,
                subtotal,
                total: subtotal,
            },
        });

        // Notificación en tiempo real al negocio
        await this.notifications.pushToTenant(tenant.id, {
            type: 'online_order',
            title: '🛍️ Nuevo pedido online',
            message: `${dto.customerName} · ${dto.items.length} producto${dto.items.length !== 1 ? 's' : ''} · ${order.type === 'delivery' ? 'Delivery' : 'Pickup'} · ${orderNumber}`,
            color: '#FF5C35',
            link: '/sales',
        });

        // Webhook n8n — nuevo pedido
        try {
            await fetch("https://n8n.daxcloud.shop/webhook-test/nuevo-pedido", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderNumber,
                    customerName: dto.customerName,
                    customerPhone: dto.customerPhone,
                    type: dto.type,
                    total: subtotal,
                    items: dto.items,
                    notes: dto.notes ?? "",
                    tenantName: tenant.name,
                    createdAt: new Date().toISOString(),
                }),
            });
        } catch (e) {
            // No bloquea el pedido si n8n falla
        }

        return order;
    }

    // ── PRIVADO — listar pedidos del tenant ─────────────────────────────────
    async findAll(tenantId: string, status?: string) {
        return this.prisma.onlineOrder.findMany({
            where: { tenantId, ...(status ? { status } : {}) },
            include: { branch: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    // ── PRIVADO — cambiar estado ────────────────────────────────────────────
    async updateStatus(tenantId: string, id: string, status: string) {
        const order = await this.prisma.onlineOrder.findFirst({ where: { id, tenantId } });
        if (!order) throw new NotFoundException('Pedido no encontrado');

        return this.prisma.onlineOrder.update({
            where: { id },
            data: { status },
        });
    }

    // ── PRIVADO — stats ─────────────────────────────────────────────────────
    async getStats(tenantId: string) {
        const [total, newOrders, preparing, ready] = await Promise.all([
            this.prisma.onlineOrder.count({ where: { tenantId } }),
            this.prisma.onlineOrder.count({ where: { tenantId, status: 'new' } }),
            this.prisma.onlineOrder.count({ where: { tenantId, status: 'preparing' } }),
            this.prisma.onlineOrder.count({ where: { tenantId, status: 'ready' } }),
        ]);
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayOrders = await this.prisma.onlineOrder.count({ where: { tenantId, createdAt: { gte: todayStart } } });
        return { total, new: newOrders, preparing, ready, today: todayOrders };
    }
}