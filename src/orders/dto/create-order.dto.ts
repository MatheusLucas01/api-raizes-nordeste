import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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

// Converte 0, null e string vazia em undefined ANTES da validação rodar.
// Necessário porque o Swagger UI manda 0 como valor default no body de exemplo
// para campos number, mas semanticamente 0 deve ser tratado como "não informado".
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === 0 || value === null || value === '' ? undefined : value;

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

  @ApiPropertyOptional({
    description:
      'Pontos a serem resgatados. Envie 0 (ou omita) para não resgatar. Apenas cliente identificado pode resgatar.',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsInt({ message: 'usePoints deve ser um número inteiro.' })
  @Min(1, { message: 'usePoints deve ser maior que zero (envie 0 ou omita para não resgatar).' })
  usePoints?: number;

  @ApiPropertyOptional({
    description:
      'Id do cliente em nome de quem o pedido é criado. APENAS PARA STAFF (atendente, gerente, admin). Cliente comum deve enviar 0 ou omitir — o id é extraído do JWT.',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsInt({ message: 'clientId deve ser um número inteiro.' })
  @IsPositive({ message: 'clientId deve ser positivo.' })
  clientId?: number;
}
