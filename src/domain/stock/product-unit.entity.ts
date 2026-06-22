export class ProductUnitEntity {
  constructor(
    public readonly productId: number,
    public readonly unitId: number,
    private _localPrice: number,
    private _currentQuantity: number,
    private _isAvailable: boolean,
  ) {}

  get localPrice(): number {
    return this._localPrice;
  }

  get currentQuantity(): number {
    return this._currentQuantity;
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  hasStockFor(qty: number): boolean {
    return this._currentQuantity >= qty;
  }

  decrementStock(qty: number): void {
    if (qty <= 0) {
      throw new Error('A quantidade deve ser positiva.');
    }
    if (!this.hasStockFor(qty)) {
      throw new Error('Estoque insuficiente.');
    }
    this._currentQuantity -= qty;
  }

  incrementStock(qty: number): void {
    if (qty <= 0) {
      throw new Error('A quantidade deve ser positiva.');
    }
    this._currentQuantity += qty;
  }

  updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new Error('O preço deve ser positivo.');
    }
    this._localPrice = newPrice;
  }

  makeAvailable(): void {
    this._isAvailable = true;
  }

  makeUnavailable(): void {
    this._isAvailable = false;
  }

  static fromPrisma(data: {
    productId: number;
    unitId: number;
    localPrice: { toString(): string } | number;
    currentQuantity: number;
    isAvailable: boolean;
  }): ProductUnitEntity {
    const price =
      typeof data.localPrice === 'number'
        ? data.localPrice
        : parseFloat(data.localPrice.toString());
    return new ProductUnitEntity(
      data.productId,
      data.unitId,
      price,
      data.currentQuantity,
      data.isAvailable,
    );
  }
}
