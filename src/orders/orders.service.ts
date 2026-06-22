import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MovementType,
  OrderChannel,
  OrderStatus,
  PaymentStatus,
  Prisma,
  Role,
} from '../generated/prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { canTransitionTo } from '../domain/order/order-status.machine';

const POINT_VALUE = 0.01;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateOrderDto,
    requestingUserId: number,
    requestingUserRole: Role,
  ): Promise<OrderResponseDto> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
    });
    if (!unit) {
      throw new NotFoundException(
        `Unidade com id ${dto.unitId} não encontrada.`,
      );
    }
    if (!unit.isActive) {
      throw new ConflictException('Unidade está inativa.');
    }

    const isStaff = requestingUserRole !== Role.CLIENT;
    let clientId: number | null;
    if (isStaff) {
      clientId = dto.clientId ?? null;
      if (clientId !== null) {
        const client = await this.prisma.user.findUnique({
          where: { id: clientId },
        });
        if (!client) {
          throw new NotFoundException(
            `Cliente com id ${clientId} não encontrado.`,
          );
        }
      }
    } else {
      if (dto.clientId !== undefined && dto.clientId !== requestingUserId) {
        throw new ForbiddenException(
          'Cliente não pode criar pedido em nome de outro usuário.',
        );
      }
      clientId = requestingUserId;
    }

    if (dto.items.length === 0) {
      throw new BadRequestException('O pedido deve ter ao menos 1 item.');
    }

    const productIds = dto.items.map((i) => i.productId);
    const productUnits = await this.prisma.productUnit.findMany({
      where: { unitId: dto.unitId, productId: { in: productIds } },
    });

    for (const item of dto.items) {
      const pu = productUnits.find((p) => p.productId === item.productId);
      if (!pu) {
        throw new NotFoundException(
          `Produto ${item.productId} não encontrado no cardápio da unidade ${dto.unitId}.`,
        );
      }
      if (!pu.isAvailable) {
        throw new ConflictException(
          `Produto ${item.productId} está indisponível na unidade.`,
        );
      }
      if (pu.currentQuantity < item.quantity) {
        throw new ConflictException(
          `Estoque insuficiente para o produto ${item.productId} (disponível: ${pu.currentQuantity}).`,
        );
      }
    }

    let subtotal = 0;
    const snapshots = new Map<number, number>();
    for (const item of dto.items) {
      const pu = productUnits.find((p) => p.productId === item.productId)!;
      const price = parseFloat(pu.localPrice.toString());
      snapshots.set(item.productId, price);
      subtotal += price * item.quantity;
    }

    let discountApplied = 0;
    let pointsUsed = 0;
    if (dto.usePoints && dto.usePoints > 0) {
      if (clientId === null) {
        throw new ConflictException(
          'Pedido anônimo não pode resgatar pontos de fidelidade.',
        );
      }
      const client = await this.prisma.user.findUnique({
        where: { id: clientId },
      });
      if (!client || client.loyaltyPoints < dto.usePoints) {
        throw new ConflictException('Saldo de pontos de fidelidade insuficiente.');
      }
      const requestedDiscount = dto.usePoints * POINT_VALUE;
      const maxDiscount = subtotal * 0.5;
      if (requestedDiscount > maxDiscount) {
        throw new ConflictException(
          'O desconto por pontos não pode exceder 50% do subtotal.',
        );
      }
      discountApplied = requestedDiscount;
      pointsUsed = dto.usePoints;
    }

    const total = Math.max(0, subtotal - discountApplied);

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          clientId,
          unitId: dto.unitId,
          canalPedido: dto.canalPedido,
          currentStatus: OrderStatus.WAITING_PAYMENT,
          subtotal,
          discountApplied,
          total,
        },
      });

      for (const item of dto.items) {
        const priceSnapshot = snapshots.get(item.productId)!;
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceSnapshot,
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            unitId: dto.unitId,
            type: MovementType.OUT,
            quantity: item.quantity,
            reason: `Venda — Pedido #${order.id}`,
            userId: requestingUserId,
          },
        });
        await tx.productUnit.update({
          where: {
            productId_unitId: {
              productId: item.productId,
              unitId: dto.unitId,
            },
          },
          data: { currentQuantity: { decrement: item.quantity } },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: null,
          newStatus: OrderStatus.WAITING_PAYMENT,
          changedById: requestingUserId,
          reason: 'Pedido criado',
        },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          status: PaymentStatus.PENDING,
          attemptNumber: 1,
        },
      });

      if (pointsUsed > 0 && clientId !== null) {
        await tx.user.update({
          where: { id: clientId },
          data: { loyaltyPoints: { decrement: pointsUsed } },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: true, payments: true },
      });
    });

    return new OrderResponseDto(result);
  }

  async findAll(
    pagination: PaginationDto,
    filters: {
      canalPedido?: OrderChannel;
      status?: OrderStatus;
      unitId?: number;
    },
    requestingUserId: number,
    requestingUserRole: Role,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (filters.canalPedido) where.canalPedido = filters.canalPedido;
    if (filters.status) where.currentStatus = filters.status;
    if (filters.unitId) where.unitId = filters.unitId;
    if (requestingUserRole === Role.CLIENT) {
      where.clientId = requestingUserId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, payments: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => new OrderResponseDto(o)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: number,
    requestingUserId: number,
    requestingUserRole: Role,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!order) {
      throw new NotFoundException(`Pedido com id ${id} não encontrado.`);
    }
    if (
      requestingUserRole === Role.CLIENT &&
      order.clientId !== requestingUserId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este pedido.',
      );
    }
    return new OrderResponseDto(order);
  }

  async updateStatus(
    id: number,
    dto: UpdateOrderStatusDto,
    requestingUserId: number,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Pedido com id ${id} não encontrado.`);
    }

    if (!canTransitionTo(order.currentStatus, dto.newStatus)) {
      throw new ConflictException(
        `Transição inválida do status ${order.currentStatus} para ${dto.newStatus}.`,
      );
    }

    if (dto.newStatus === OrderStatus.CANCELLED) {
      return this.doCancel(id, dto.reason, requestingUserId);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { currentStatus: dto.newStatus },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: order.currentStatus,
          newStatus: dto.newStatus,
          changedById: requestingUserId,
          reason: dto.reason,
        },
      });
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: { items: true, payments: true },
      });
    });

    return new OrderResponseDto(result);
  }

  async cancel(
    id: number,
    dto: CancelOrderDto,
    requestingUserId: number,
    requestingUserRole: Role,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Pedido com id ${id} não encontrado.`);
    }

    if (requestingUserRole === Role.CLIENT) {
      if (order.clientId !== requestingUserId) {
        throw new ForbiddenException(
          'Você não pode cancelar pedidos de outro cliente.',
        );
      }
      if (order.currentStatus !== OrderStatus.WAITING_PAYMENT) {
        throw new ConflictException(
          'Cliente só pode cancelar pedidos no status WAITING_PAYMENT.',
        );
      }
    }

    if (!canTransitionTo(order.currentStatus, OrderStatus.CANCELLED)) {
      throw new ConflictException(
        `Pedido no status ${order.currentStatus} não pode ser cancelado.`,
      );
    }

    return this.doCancel(id, dto.reason, requestingUserId);
  }

  private async doCancel(
    id: number,
    reason: string | undefined,
    requestingUserId: number,
  ): Promise<OrderResponseDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });

      for (const item of order.items) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            unitId: order.unitId,
            type: MovementType.IN,
            quantity: item.quantity,
            reason: `Devolução por cancelamento — Pedido #${order.id}`,
            userId: requestingUserId,
          },
        });
        await tx.productUnit.update({
          where: {
            productId_unitId: {
              productId: item.productId,
              unitId: order.unitId,
            },
          },
          data: { currentQuantity: { increment: item.quantity } },
        });
      }

      const discountApplied = parseFloat(order.discountApplied.toString());
      if (discountApplied > 0 && order.clientId !== null) {
        const pointsRefund = Math.round(discountApplied / POINT_VALUE);
        await tx.user.update({
          where: { id: order.clientId },
          data: { loyaltyPoints: { increment: pointsRefund } },
        });
      }

      const previousStatus = order.currentStatus;
      await tx.order.update({
        where: { id },
        data: { currentStatus: OrderStatus.CANCELLED },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus,
          newStatus: OrderStatus.CANCELLED,
          changedById: requestingUserId,
          reason: reason ?? 'Pedido cancelado',
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id },
        include: { items: true, payments: true },
      });
    });

    return new OrderResponseDto(result);
  }
}
