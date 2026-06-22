import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../generated/prisma/client';
import { PaymentResponseDto } from './payment-response.dto';

export class PaymentProcessResultDto {
  @ApiProperty({ type: PaymentResponseDto })
  payment: PaymentResponseDto;

  @ApiProperty({
    example: { id: 1, currentStatus: 'IN_PREPARATION' },
    description: 'Status atual do pedido após o processamento.',
  })
  order: { id: number; currentStatus: OrderStatus };

  @ApiProperty({
    example: 49,
    description:
      'Pontos de fidelidade creditados ao cliente em caso de aprovação (1 ponto por R$1,00 do total). Zero se o pagamento foi recusado ou o pedido foi anônimo.',
  })
  pointsEarned: number;

  @ApiProperty({ example: 'Pagamento aprovado pelo gateway simulado.' })
  message: string;
}
