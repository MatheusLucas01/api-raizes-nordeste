import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { MovementsQueryDto } from './dto/movements-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../generated/prisma/client';

@ApiTags('stock-movements')
@ApiBearerAuth()
@Controller('units/:unitId/stock/movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  record(
    @Param('unitId', ParseIntPipe) unitId: number,
    @Body() dto: CreateMovementDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.movementsService.record(unitId, dto, userId);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get()
  list(
    @Param('unitId', ParseIntPipe) unitId: number,
    @Query() query: MovementsQueryDto,
  ) {
    return this.movementsService.list(
      unitId,
      { page: query.page, limit: query.limit },
      {
        productId: query.productId,
        type: query.type,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      },
    );
  }
}
