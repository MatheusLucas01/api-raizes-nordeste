import { ApiProperty } from '@nestjs/swagger';
import { Payment, PaymentStatus } from '../../generated/prisma/client';

export class PaymentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  orderId: number;

  @ApiProperty({ example: 49.8 })
  amount: number;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ example: 1 })
  attemptNumber: number;

  @ApiProperty({ required: false, nullable: true })
  providerRef: string | null;

  @ApiProperty()
  createdAt: Date;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.orderId = payment.orderId;
    this.amount = parseFloat(payment.amount.toString());
    this.status = payment.status;
    this.attemptNumber = payment.attemptNumber;
    this.providerRef = payment.providerRef;
    this.createdAt = payment.createdAt;
  }
}
