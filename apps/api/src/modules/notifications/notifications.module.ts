import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway }    from './notifications.gateway';
import { NotificationsService }    from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule }            from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  providers:   [NotificationsGateway, NotificationsService],
  controllers: [NotificationsController],
  exports:     [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}