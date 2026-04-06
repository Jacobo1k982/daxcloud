import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.tenantId) return true;

        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId: user.tenantId },
        });

        if (!subscription) return true;

        // Trial vencido
        if (
            subscription.status === 'trialing' &&
            subscription.trialEndsAt &&
            new Date() > subscription.trialEndsAt
        ) {
            throw new ForbiddenException({
                code: 'TRIAL_EXPIRED',
                message: 'Tu período de prueba ha vencido. Activa un plan para continuar.',
                trialEndsAt: subscription.trialEndsAt,
            });
        }

        // Suscripción cancelada
        if (subscription.status === 'cancelled') {
            throw new ForbiddenException({
                code: 'SUBSCRIPTION_CANCELLED',
                message: 'Tu suscripción está cancelada. Reactívala para continuar.',
            });
        }

        return true;
    }
}