import { ApiProperty } from '@nestjs/swagger';
import {
  MovementType,
  StockMovement,
} from '../../generated/prisma/client';

export class MovementResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  productId: number;

  @ApiProperty({ example: 1 })
  unitId: number;

  @ApiProperty({ enum: MovementType })
  type: MovementType;

  @ApiProperty({ example: 20 })
  quantity: number;

  @ApiProperty({ required: false, nullable: true })
  reason: string | null;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty()
  createdAt: Date;

  constructor(m: StockMovement) {
    this.id = m.id;
    this.productId = m.productId;
    this.unitId = m.unitId;
    this.type = m.type;
    this.quantity = m.quantity;
    this.reason = m.reason;
    this.userId = m.userId;
    this.createdAt = m.createdAt;
  }
}
