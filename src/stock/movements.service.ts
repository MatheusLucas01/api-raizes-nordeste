import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType, Prisma } from '../generated/prisma/client';
import { CreateMovementDto } from './dto/create-movement.dto';
import { MovementResponseDto } from './dto/movement-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class MovementsService {
  constructor(private prisma: PrismaService) {}

  async record(
    unitId: number,
    dto: CreateMovementDto,
    userId: number,
  ): Promise<MovementResponseDto> {
    const productUnit = await this.prisma.productUnit.findUnique({
      where: {
        productId_unitId: { productId: dto.productId, unitId },
      },
    });

    if (!productUnit) {
      throw new NotFoundException(
        `Produto ${dto.productId} não encontrado no cardápio da unidade ${unitId}.`,
      );
    }

    if (dto.type === MovementType.OUT && productUnit.currentQuantity < dto.quantity) {
      throw new ConflictException('Estoque insuficiente para a saída solicitada.');
    }

    const delta = dto.type === MovementType.IN ? dto.quantity : -dto.quantity;

    const movement = await this.prisma.$transaction(async (tx) => {
      const m = await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          unitId,
          type: dto.type,
          quantity: dto.quantity,
          reason: dto.reason,
          userId,
        },
      });

      await tx.productUnit.update({
        where: { productId_unitId: { productId: dto.productId, unitId } },
        data: { currentQuantity: { increment: delta } },
      });

      return m;
    });

    return new MovementResponseDto(movement);
  }

  async list(
    unitId: number,
    pagination: PaginationDto,
    filters: {
      productId?: number;
      type?: MovementType;
      from?: Date;
      to?: Date;
    } = {},
  ) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new NotFoundException(`Unidade com id ${unitId} não encontrada.`);
    }

    if (filters.from && filters.to && filters.from > filters.to) {
      throw new BadRequestException('O filtro "from" não pode ser posterior ao "to".');
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = { unitId };
    if (filters.productId) where.productId = filters.productId;
    if (filters.type) where.type = filters.type;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements.map((m) => new MovementResponseDto(m)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
