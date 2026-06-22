export class OrderItemEntity {
  constructor(
    public readonly productId: number,
    public readonly quantity: number,
    public readonly priceSnapshot: number,
  ) {
    if (quantity <= 0) {
      throw new Error('A quantidade do item deve ser positiva.');
    }
    if (priceSnapshot <= 0) {
      throw new Error('O preço do item deve ser positivo.');
    }
  }

  lineTotal(): number {
    return this.priceSnapshot * this.quantity;
  }
}
