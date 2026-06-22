import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { AddMenuItemDto } from './dto/add-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../generated/prisma/client';

@ApiTags('menu')
@ApiBearerAuth()
@Controller('units/:unitId/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  add(
    @Param('unitId', ParseIntPipe) unitId: number,
    @Body() dto: AddMenuItemDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.menuService.addItem(unitId, dto, userId);
  }

  @Get()
  list(
    @Param('unitId', ParseIntPipe) unitId: number,
    @Query() query: MenuQueryDto,
  ) {
    return this.menuService.listMenu(
      unitId,
      { page: query.page, limit: query.limit },
      { onlyAvailable: query.onlyAvailable, category: query.category },
    );
  }

  @Get(':productId')
  get(
    @Param('unitId', ParseIntPipe) unitId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.menuService.getItem(unitId, productId);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':productId')
  update(
    @Param('unitId', ParseIntPipe) unitId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateItem(unitId, productId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('unitId', ParseIntPipe) unitId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.menuService.removeItem(unitId, productId);
  }
}
