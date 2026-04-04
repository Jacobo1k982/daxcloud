import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: {
    type: string; title: string; message: string;
    icon?: string; color?: string; link?: string; meta?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        type:    dto.type,
        title:   dto.title,
        message: dto.message,
        icon:    dto.icon    ?? 'bell',
        color:   dto.color   ?? '#5AAAF0',
        link:    dto.link,
        meta:    dto.meta,
        read:    false,
      },
    });
  }

  async getUnread(tenantId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAll(tenantId: string, page = 1) {
    const take = 30;
    const skip = (page - 1) * take;
    return this.prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take, skip,
    });
  }

  async markRead(id: string, tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { id, tenantId },
      data: { read: true },
    });
  }

  async markAllRead(tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(tenantId: string) {
    return this.prisma.notification.count({
      where: { tenantId, read: false },
    });
  }
}