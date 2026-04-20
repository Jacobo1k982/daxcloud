import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { OnlineOrdersService } from './online-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('online-orders')
@UseGuards(JwtAuthGuard)
export class OnlineOrdersController {
    constructor(private readonly service: OnlineOrdersService) { }

    @Get()
    findAll(@CurrentUser() user: any, @Query('status') status?: string) {
        return this.service.findAll(user.tenantId, status);
    }

    @Get('stats')
    getStats(@CurrentUser() user: any) {
        return this.service.getStats(user.tenantId);
    }

    @Patch(':id/status')
    updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body('status') status: string) {
        return this.service.updateStatus(user.tenantId, id, status);
    }
}
