import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderChannel, OrderStatus } from '../../generated/prisma/client';

export class OrdersQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: OrderChannel,
    description: 'Filtra por canal de origem do pedido.',
  })
  @IsOptional()
  @IsEnum(OrderChannel, {
    message:
      'canalPedido deve ser um dos valores: APP, TOTEM, BALCAO, PICKUP, WEB.',
  })
  canalPedido?: OrderChannel;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filtra por status.' })
  @IsOptional()
  @IsEnum(OrderStatus, {
    message:
      'status deve ser um dos valores: WAITING_PAYMENT, IN_PREPARATION, READY, DELIVERED, CANCELLED.',
  })
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filtra por unidade.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'unitId deve ser um número inteiro.' })
  @IsPositive({ message: 'unitId deve ser positivo.' })
  unitId?: number;
}
