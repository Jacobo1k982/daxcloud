import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getAll(@CurrentUser() user: any, @Query('page') page = '1') {
    return this.notificationsService.getAll(user.tenantId, Number(page));
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.tenantId);
  }

  @Put(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markRead(id, user.tenantId);
  }

  @Put('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.tenantId);
  }
}