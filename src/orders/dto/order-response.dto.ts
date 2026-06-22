import { ApiProperty } from '@nestjs/swagger';
import {
  Order,
  OrderItem,
  OrderChannel,
  OrderStatus,
  Payment,
  PaymentStatus,
} from '../../generated/prisma/client';
import { OrderItemResponseDto } from './order-item-response.dto';

type OrderWithRelations = Order & {
  items?: OrderItem[];
  payments?: Payment[];
};

export class LatestPaymentDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ example: 49.8 })
  amount: number;

  @ApiProperty({ example: 1 })
  attemptNumber: number;

  @ApiProperty()
  createdAt: Date;

  constructor(p: Payment) {
    this.id = p.id;
    this.status = p.status;
    this.amount = parseFloat(p.amount.toString());
    this.attemptNumber = p.attemptNumber;
    this.createdAt = p.createdAt;
  }
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ required: false, nullable: true, example: 5 })
  clientId: number | null;

  @ApiProperty({ example: 1 })
  unitId: number;

  @ApiProperty({ enum: OrderChannel })
  canalPedido: OrderChannel;

  @ApiProperty({ enum: OrderStatus })
  currentStatus: OrderStatus;

  @ApiProperty({ example: 49.8 })
  subtotal: number;

  @ApiProperty({ example: 0 })
  discountApplied: number;

  @ApiProperty({ example: 49.8 })
  total: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [OrderItemResponseDto], required: false })
  items?: OrderItemResponseDto[];

  @ApiProperty({ type: LatestPaymentDto, required: false, nullable: true })
  latestPayment: LatestPaymentDto | null;

  constructor(order: OrderWithRelations) {
    this.id = order.id;
    this.clientId = order.clientId;
    this.unitId = order.unitId;
    this.canalPedido = order.canalPedido;
    this.currentStatus = order.currentStatus;
    this.subtotal = parseFloat(order.subtotal.toString());
    this.discountApplied = parseFloat(order.discountApplied.toString());
    this.total = parseFloat(order.total.toString());
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
    if (order.items) {
      this.items = order.items.map((i) => new OrderItemResponseDto(i));
    }
    if (order.payments && order.payments.length > 0) {
      const latest = [...order.payments].sort(
        (a, b) => b.attemptNumber - a.attemptNumber,
      )[0];
      this.latestPayment = new LatestPaymentDto(latest);
    } else {
      this.latestPayment = null;
    }
  }
}
