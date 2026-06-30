import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === null || value === '' ? undefined : value;

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

  @ApiPropertyOptional({
    example: 50,
    description: 'Estoque inicial (gera StockMovement IN se > 0). Omita ou envie 0 para começar sem estoque.',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsInt({ message: 'initialQuantity deve ser um número inteiro.' })
  @Min(0, { message: 'initialQuantity não pode ser negativo.' })
  initialQuantity?: number;
}
