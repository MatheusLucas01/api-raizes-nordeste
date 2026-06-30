import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: 'IN_PREPARATION' })
  @IsEnum(OrderStatus, {
    message:
      'newStatus deve ser um dos valores: WAITING_PAYMENT, IN_PREPARATION, READY, DELIVERED, CANCELLED.',
  })
  newStatus!: OrderStatus;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString({ message: 'reason deve ser um texto.' })
  @MaxLength(255, { message: 'reason deve ter no máximo 255 caracteres.' })
  reason?: string;
}
