import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { MovementType } from '../../generated/prisma/client';

export class CreateMovementDto {
  @ApiProperty({ example: 10 })
  @IsInt({ message: 'productId deve ser um número inteiro.' })
  @IsPositive({ message: 'productId deve ser positivo.' })
  productId!: number;

  @ApiProperty({ enum: MovementType, example: 'IN' })
  @IsEnum(MovementType, { message: 'type deve ser IN ou OUT.' })
  type!: MovementType;

  @ApiProperty({ example: 20 })
  @IsInt({ message: 'quantity deve ser um número inteiro.' })
  @IsPositive({ message: 'quantity deve ser positivo.' })
  quantity!: number;

  @ApiPropertyOptional({
    example: 'Reposição mensal',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'reason deve ser um texto.' })
  @MaxLength(255, { message: 'reason deve ter no máximo 255 caracteres.' })
  reason?: string;
}
