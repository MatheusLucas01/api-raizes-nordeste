import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MovementType } from '../../generated/prisma/client';

export class MovementsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtra por id de produto.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'productId deve ser um número inteiro.' })
  @IsPositive({ message: 'productId deve ser positivo.' })
  productId?: number;

  @ApiPropertyOptional({ enum: MovementType, description: 'Filtra por tipo.' })
  @IsOptional()
  @IsEnum(MovementType, { message: 'type deve ser IN ou OUT.' })
  type?: MovementType;

  @ApiPropertyOptional({ description: 'Data inicial (ISO 8601).' })
  @IsOptional()
  @IsString({ message: 'from deve ser um texto (ISO 8601).' })
  from?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO 8601).' })
  @IsOptional()
  @IsString({ message: 'to deve ser um texto (ISO 8601).' })
  to?: string;
}
