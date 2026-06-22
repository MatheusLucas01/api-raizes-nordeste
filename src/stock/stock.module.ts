import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';

@Module({
  imports: [PrismaModule],
  providers: [MenuService, MovementsService],
  controllers: [MenuController, MovementsController],
  exports: [MenuService, MovementsService],
})
export class StockModule {}
