import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUnitDto): Promise<UnitResponseDto> {
    const unit = await this.prisma.unit.create({
      data: {
        name: dto.name,
        address: dto.address,
        isActive: dto.isActive ?? true,
      },
    });
    return new UnitResponseDto(unit);
  }

  async findAll(pagination: PaginationDto, onlyActive?: boolean) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = onlyActive ? { isActive: true } : {};

    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.unit.count({ where }),
    ]);

    return {
      data: units.map((u) => new UnitResponseDto(u)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<UnitResponseDto> {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      throw new NotFoundException(`Unidade com id ${id} não encontrada.`);
    }
    return new UnitResponseDto(unit);
  }

  async update(id: number, dto: UpdateUnitDto): Promise<UnitResponseDto> {
    try {
      const updated = await this.prisma.unit.update({
        where: { id },
        data: dto,
      });
      return new UnitResponseDto(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Unidade com id ${id} não encontrada.`);
      }
      throw error;
    }
  }

  async deactivate(id: number): Promise<UnitResponseDto> {
    const current = await this.prisma.unit.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Unidade com id ${id} não encontrada.`);
    }
    if (!current.isActive) {
      throw new ConflictException('Unidade já está inativa.');
    }
    const updated = await this.prisma.unit.update({
      where: { id },
      data: { isActive: false },
    });
    return new UnitResponseDto(updated);
  }

  async activate(id: number): Promise<UnitResponseDto> {
    const current = await this.prisma.unit.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Unidade com id ${id} não encontrada.`);
    }
    if (current.isActive) {
      throw new ConflictException('Unidade já está ativa.');
    }
    const updated = await this.prisma.unit.update({
      where: { id },
      data: { isActive: true },
    });
    return new UnitResponseDto(updated);
  }
}
