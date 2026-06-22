import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MovementType, Role } from '../generated/prisma/client';

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
    @Query() pagination: PaginationDto,
    @Query('productId', new ParseIntPipe({ optional: true }))
    productId?: number,
    @Query('type', new ParseEnumPipe(MovementType, { optional: true }))
    type?: MovementType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.movementsService.list(unitId, pagination, {
      productId,
      type,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
