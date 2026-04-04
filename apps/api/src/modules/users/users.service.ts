import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        jobTitle: true,
        avatarUrl: true,
        active: true,
        createdAt: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        jobTitle: true,
        avatarUrl: true,
        language: true,
        timezone: true,
        signature: true,
        active: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, tenantId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    avatarUrl?: string;
    language?: string;
    timezone?: string;
    signature?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('Usuario no encontrado');

    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email: data.email } },
      });
      if (existing) throw new BadRequestException('El correo ya está en uso');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.signature !== undefined && { signature: data.signature }),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, jobTitle: true, avatarUrl: true,
        language: true, timezone: true, signature: true,
      },
    });
  }

  async updatePin(userId: string, tenantId: string, pin: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('Usuario no encontrado');
    if (pin && !/^\d{4,6}$/.test(pin)) throw new BadRequestException('El PIN debe ser de 4 a 6 dígitos');
    const posPin = pin ? await bcrypt.hash(pin, 10) : null;
    await this.prisma.user.update({ where: { id: userId }, data: { posPin } });
    return { message: 'PIN actualizado correctamente' };
  }

  async changePassword(userId: string, tenantId: string, data: {
    currentPassword: string;
    newPassword: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('Usuario no encontrado');
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('La contraseña actual es incorrecta');
    if (data.newPassword.length < 8) throw new BadRequestException('Mínimo 8 caracteres');
    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Contraseña actualizada correctamente' };
  }

  async invite(tenantId: string, data: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'manager' | 'cashier';
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: data.email } },
    });
    if (existing) throw new BadRequestException('El correo ya está registrado');
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const user = await this.prisma.user.create({
      data: { tenantId, email: data.email, firstName: data.firstName, lastName: data.lastName, role: data.role, passwordHash },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    return { user, tempPassword, message: 'Usuario creado exitosamente.' };
  }

  async toggleActive(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({
      where: { id: userId },
      data: { active: !user.active },
      select: { id: true, active: true },
    });
  }
}