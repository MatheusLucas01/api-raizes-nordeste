import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        isActive: dto.isActive ?? true,
      },
    });
    return new ProductResponseDto(product);
  }

  async findAll(
    pagination: PaginationDto,
    filters: { onlyActive?: boolean; category?: string } = {},
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (filters.onlyActive) where.isActive = true;
    if (filters.category) where.category = filters.category;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => new ProductResponseDto(p)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Produto com id ${id} não encontrado.`);
    }
    return new ProductResponseDto(product);
  }

  async update(
    id: number,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: dto,
      });
      return new ProductResponseDto(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Produto com id ${id} não encontrado.`);
      }
      throw error;
    }
  }

  async deactivate(id: number): Promise<ProductResponseDto> {
    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Produto com id ${id} não encontrado.`);
    }
    if (!current.isActive) {
      throw new ConflictException('Produto já está inativo.');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return new ProductResponseDto(updated);
  }

  async activate(id: number): Promise<ProductResponseDto> {
    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Produto com id ${id} não encontrado.`);
    }
    if (current.isActive) {
      throw new ConflictException('Produto já está ativo.');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive: true },
    });
    return new ProductResponseDto(updated);
  }
}
