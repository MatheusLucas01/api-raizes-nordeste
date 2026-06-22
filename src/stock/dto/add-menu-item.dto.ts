import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class AddMenuItemDto {
  @ApiProperty({ example: 10 })
  @IsInt({ message: 'productId deve ser um número inteiro.' })
  @IsPositive({ message: 'productId deve ser positivo.' })
  productId!: number;

  @ApiProperty({ example: 24.9, description: 'Preço local na unidade.' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'localPrice deve ser um número com no máximo 2 casas decimais.' },
  )
  @IsPositive({ message: 'localPrice deve ser positivo.' })
  localPrice!: number;

  @ApiProperty({
    required: false,
    example: 50,
    description: 'Estoque inicial (gera StockMovement IN se > 0).',
  })
  @IsOptional()
  @IsInt({ message: 'initialQuantity deve ser um número inteiro.' })
  @Min(0, { message: 'initialQuantity não pode ser negativo.' })
  initialQuantity?: number;
}
