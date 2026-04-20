import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { OnlineOrdersService } from './online-orders.service';

@Controller('public')
export class PublicOrdersController {
    constructor(private readonly service: OnlineOrdersService) { }

    @Get(':slug/catalog')
    getCatalog(@Param('slug') slug: string) {
        return this.service.getPublicCatalog(slug);
    }

    @Post(':slug/orders')
    createOrder(@Param('slug') slug: string, @Body() body: any) {
        return this.service.createPublicOrder(slug, body);
    }
}