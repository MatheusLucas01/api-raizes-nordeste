import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OrderStatus,
  PaymentStatus,
  Role,
} from '../generated/prisma/client';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentProcessResultDto } from './dto/payment-process-result.dto';
import { simulatePayment } from '../domain/payment/payment-gateway-mock';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async listByOrder(
    orderId: number,
    requestingUserId: number,
    requestingUserRole: Role,
  ): Promise<PaymentResponseDto[]> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Pedido com id ${orderId} não encontrado.`);
    }
    if (
      requestingUserRole === Role.CLIENT &&
      order.clientId !== requestingUserId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar os pagamentos deste pedido.',
      );
    }
    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { attemptNumber: 'asc' },
    });
    return payments.map((p) => new PaymentResponseDto(p));
  }

  async processLatest(
    orderId: number,
    requestingUserId: number,
    requestingUserRole: Role,
  ): Promise<PaymentProcessResultDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Pedido com id ${orderId} não encontrado.`);
    }
    if (
      requestingUserRole === Role.CLIENT &&
      order.clientId !== requestingUserId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para processar pagamentos deste pedido.',
      );
    }
    if (order.currentStatus !== OrderStatus.WAITING_PAYMENT) {
      throw new ConflictException(
        `Pedido não está aguardando pagamento (status atual: ${order.currentStatus}).`,
      );
    }

    const pending = await this.prisma.payment.findFirst({
      where: { orderId, status: PaymentStatus.PENDING },
      orderBy: { attemptNumber: 'desc' },
    });
    if (!pending) {
      throw new ConflictException(
        'Não há tentativa de pagamento pendente para este pedido. Use /retry para criar uma nova tentativa.',
      );
    }

    const amount = parseFloat(pending.amount.toString());
    const result = simulatePayment(amount);

    const final = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: pending.id },
        data: {
          status: result.approved
            ? PaymentStatus.APPROVED
            : PaymentStatus.REFUSED,
          providerRef: result.providerRef,
        },
      });

      let updatedOrder = order;
      let pointsEarned = 0;

      if (result.approved) {
        updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: { currentStatus: OrderStatus.IN_PREPARATION },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: OrderStatus.WAITING_PAYMENT,
            newStatus: OrderStatus.IN_PREPARATION,
            changedById: requestingUserId,
            reason: `Pagamento aprovado (ref: ${result.providerRef}).`,
          },
        });

        if (order.clientId !== null) {
          const totalNumber = parseFloat(order.total.toString());
          pointsEarned = Math.floor(totalNumber);
          if (pointsEarned > 0) {
            await tx.user.update({
              where: { id: order.clientId },
              data: { loyaltyPoints: { increment: pointsEarned } },
            });
          }
        }
      }

      return { payment: updatedPayment, order: updatedOrder, pointsEarned };
    });

    return {
      payment: new PaymentResponseDto(final.payment),
      order: { id: final.order.id, currentStatus: final.order.currentStatus },
      pointsEarned: final.pointsEarned,
      message: result.reason,
    };
  }

  async retry(
    orderId: number,
    requestingUserId: number,
    requestingUserRole: Role,
  ): Promise<PaymentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Pedido com id ${orderId} não encontrado.`);
    }
    if (
      requestingUserRole === Role.CLIENT &&
      order.clientId !== requestingUserId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para retentar pagamentos deste pedido.',
      );
    }
    if (order.currentStatus !== OrderStatus.WAITING_PAYMENT) {
      throw new ConflictException(
        `Pedido não está aguardando pagamento (status atual: ${order.currentStatus}).`,
      );
    }

    const existingPending = await this.prisma.payment.findFirst({
      where: { orderId, status: PaymentStatus.PENDING },
    });
    if (existingPending) {
      throw new ConflictException(
        'Já existe uma tentativa de pagamento pendente. Processe-a antes de criar uma nova.',
      );
    }

    const lastAttempt = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { attemptNumber: 'desc' },
    });
    const nextAttempt = (lastAttempt?.attemptNumber ?? 0) + 1;

    const newPayment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: order.total,
        status: PaymentStatus.PENDING,
        attemptNumber: nextAttempt,
      },
    });

    return new PaymentResponseDto(newPayment);
  }
}
