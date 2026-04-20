import { Module } from '@nestjs/common';
import { OnlineOrdersController } from './online-orders.controller';
import { OnlineOrdersService } from './online-orders.service';
import { PublicOrdersController } from './public-orders.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [OnlineOrdersController, PublicOrdersController],
    providers: [OnlineOrdersService],
})
export class OnlineOrdersModule { }