import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    example: 'Cliente desistiu antes do pagamento.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'reason deve ser um texto.' })
  @MaxLength(255, { message: 'reason deve ter no máximo 255 caracteres.' })
  reason?: string;
}
