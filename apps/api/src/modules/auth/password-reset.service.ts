import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestReset(email: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Negocio no encontrado');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });

    // Por seguridad, siempre respondemos lo mismo aunque no exista el usuario
    if (!user) return { message: 'Si el correo existe, recibirás un código en breve.' };

    // Invalida tokens anteriores
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        code,
        expiresAt,
      },
    });

    await this.emailService.sendPasswordResetCode(
      user.email,
      user.firstName,
      code,
      tenant.name,
    );

    return { message: 'Si el correo existe, recibirás un código en breve.' };
  }

  async verifyCode(email: string, tenantSlug: string, code: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Negocio no encontrado');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });
    if (!user) throw new BadRequestException('Código inválido o expirado');

    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) throw new BadRequestException('Código inválido o expirado');

    return { valid: true, tokenId: token.id };
  }

  async resetPassword(email: string, tenantSlug: string, code: string, newPassword: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Negocio no encontrado');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });
    if (!user) throw new BadRequestException('Código inválido o expirado');

    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) throw new BadRequestException('Código inválido o expirado');

    if (newPassword.length < 8) throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }
}