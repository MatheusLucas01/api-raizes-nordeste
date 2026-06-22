import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType, Prisma } from '../generated/prisma/client';
import { AddMenuItemDto } from './dto/add-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async addItem(
    unitId: number,
    dto: AddMenuItemDto,
    userId: number,
  ): Promise<MenuItemResponseDto> {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new NotFoundException(`Unidade com id ${unitId} não encontrada.`);
    }
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(
        `Produto com id ${dto.productId} não encontrado.`,
      );
    }
    const existing = await this.prisma.productUnit.findUnique({
      where: {
        productId_unitId: { productId: dto.productId, unitId },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Produto ${dto.productId} já está no cardápio da unidade ${unitId}.`,
      );
    }

    const initialQuantity = dto.initialQuantity ?? 0;

    const productUnit = await this.prisma.$transaction(async (tx) => {
      const pu = await tx.productUnit.create({
        data: {
          productId: dto.productId,
          unitId,
          localPrice: dto.localPrice,
          currentQuantity: initialQuantity,
          isAvailable: true,
        },
        include: { product: true },
      });

      if (initialQuantity > 0) {
        await tx.stockMovement.create({
          data: {
            productId: dto.productId,
            unitId,
            type: MovementType.IN,
            quantity: initialQuantity,
            reason: 'Estoque inicial na adição ao cardápio',
            userId,
          },
        });
      }

      return pu;
    });

    return new MenuItemResponseDto(productUnit);
  }

  async listMenu(
    unitId: number,
    pagination: PaginationDto,
    filters: { onlyAvailable?: boolean; category?: string } = {},
  ) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new NotFoundException(`Unidade com id ${unitId} não encontrada.`);
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductUnitWhereInput = { unitId };
    if (filters.onlyAvailable) where.isAvailable = true;
    if (filters.category) {
      where.product = { category: filters.category };
    }

    const [items, total] = await Promise.all([
      this.prisma.productUnit.findMany({
        where,
        skip,
        take: limit,
        include: { product: true },
        orderBy: { productId: 'asc' },
      }),
      this.prisma.productUnit.count({ where }),
    ]);

    return {
      data: items.map((i) => new MenuItemResponseDto(i)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getItem(
    unitId: number,
    productId: number,
  ): Promise<MenuItemResponseDto> {
    const item = await this.prisma.productUnit.findUnique({
      where: { productId_unitId: { productId, unitId } },
      include: { product: true },
    });
    if (!item) {
      throw new NotFoundException(
        `Produto ${productId} não encontrado no cardápio da unidade ${unitId}.`,
      );
    }
    return new MenuItemResponseDto(item);
  }

  async updateItem(
    unitId: number,
    productId: number,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItemResponseDto> {
    try {
      const updated = await this.prisma.productUnit.update({
        where: { productId_unitId: { productId, unitId } },
        data: dto,
        include: { product: true },
      });
      return new MenuItemResponseDto(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Produto ${productId} não encontrado no cardápio da unidade ${unitId}.`,
        );
      }
      throw error;
    }
  }

  async removeItem(unitId: number, productId: number): Promise<void> {
    const item = await this.prisma.productUnit.findUnique({
      where: { productId_unitId: { productId, unitId } },
    });
    if (!item) {
      throw new NotFoundException(
        `Produto ${productId} não encontrado no cardápio da unidade ${unitId}.`,
      );
    }
    if (item.currentQuantity > 0) {
      throw new ConflictException(
        'Não é possível remover um item do cardápio com estoque. Zere o estoque primeiro via uma movimentação.',
      );
    }
    await this.prisma.productUnit.delete({
      where: { productId_unitId: { productId, unitId } },
    });
  }
}
