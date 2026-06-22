import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from '../../generated/prisma/client';

export class OrderItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  orderId: number;

  @ApiProperty({ example: 10 })
  productId: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 24.9 })
  priceSnapshot: number;

  @ApiProperty({ example: 49.8 })
  lineTotal: number;

  constructor(item: OrderItem) {
    this.id = item.id;
    this.orderId = item.orderId;
    this.productId = item.productId;
    this.quantity = item.quantity;
    this.priceSnapshot = parseFloat(item.priceSnapshot.toString());
    this.lineTotal = this.priceSnapshot * this.quantity;
  }
}
