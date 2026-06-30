import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ example: 29.9 })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'localPrice deve ser um número com no máximo 2 casas decimais.' },
  )
  @IsPositive({ message: 'localPrice deve ser positivo.' })
  localPrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'isAvailable deve ser verdadeiro ou falso.' })
  isAvailable?: boolean;
}
