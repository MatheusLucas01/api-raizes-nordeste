import { OrderChannel, OrderStatus } from '../../generated/prisma/client';
import { canTransitionTo, isTerminal } from './order-status.machine';
import { OrderItemEntity } from './order-item.entity';

export class OrderEntity {
  constructor(
    public readonly id: number | null,
    public readonly clientId: number | null,
    public readonly unitId: number,
    public readonly canalPedido: OrderChannel,
    private _currentStatus: OrderStatus,
    private _items: OrderItemEntity[],
    private _discountApplied: number,
    public readonly createdAt: Date | null,
  ) {}

  get currentStatus(): OrderStatus {
    return this._currentStatus;
  }

  get discountApplied(): number {
    return this._discountApplied;
  }

  get items(): readonly OrderItemEntity[] {
    return this._items;
  }

  subtotal(): number {
    return this._items.reduce((acc, i) => acc + i.lineTotal(), 0);
  }

  total(): number {
    return Math.max(0, this.subtotal() - this._discountApplied);
  }

  isAnonymous(): boolean {
    return this.clientId === null;
  }

  isTerminal(): boolean {
    return isTerminal(this._currentStatus);
  }

  canTransitionTo(newStatus: OrderStatus): boolean {
    return canTransitionTo(this._currentStatus, newStatus);
  }

  transitionTo(newStatus: OrderStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Transição inválida do status ${this._currentStatus} para ${newStatus}.`,
      );
    }
    this._currentStatus = newStatus;
  }

  applyDiscount(amount: number): void {
    if (amount < 0) {
      throw new Error('O desconto não pode ser negativo.');
    }
    const maxDiscount = this.subtotal() * 0.5;
    if (amount > maxDiscount) {
      throw new Error('O desconto não pode exceder 50% do subtotal.');
    }
    this._discountApplied = amount;
  }
}
