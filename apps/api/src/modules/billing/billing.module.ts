import { Module }           from '@nestjs/common';
import { BillingService }   from './billing.service';
import { BillingController } from './billing.controller';
import { PagaditoService }  from './pagadito.service';
import { PrismaModule }     from '../../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  providers:   [BillingService, PagaditoService],
  controllers: [BillingController],
  exports:     [BillingService, PagaditoService],
})
export class BillingModule {}
