import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderChannel } from '../../generated/prisma/client';

export class OrderItemInputDto {
  @ApiProperty({ example: 10 })
  @IsInt({ message: 'productId deve ser um número inteiro.' })
  @IsPositive({ message: 'productId deve ser positivo.' })
  productId!: number;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'quantity deve ser um número inteiro.' })
  @IsPositive({ message: 'quantity deve ser positivo.' })
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'unitId deve ser um número inteiro.' })
  @IsPositive({ message: 'unitId deve ser positivo.' })
  unitId!: number;

  @ApiProperty({ enum: OrderChannel, example: 'APP' })
  @IsEnum(OrderChannel, {
    message:
      'canalPedido deve ser um dos valores: APP, TOTEM, BALCAO, PICKUP, WEB.',
  })
  canalPedido!: OrderChannel;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray({ message: 'items deve ser um array.' })
  @ArrayMinSize(1, { message: 'O pedido deve ter ao menos 1 item.' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @ApiProperty({
    required: false,
    example: 0,
    description: 'Pontos a serem resgatados (apenas cliente identificado).',
  })
  @IsOptional()
  @IsInt({ message: 'usePoints deve ser um número inteiro.' })
  @Min(0, { message: 'usePoints não pode ser negativo.' })
  usePoints?: number;

  @ApiProperty({
    required: false,
    description:
      'Id do cliente em nome de quem o pedido é criado. Apenas para staff.',
  })
  @IsOptional()
  @IsInt({ message: 'clientId deve ser um número inteiro.' })
  @IsPositive({ message: 'clientId deve ser positivo.' })
  clientId?: number;
}
