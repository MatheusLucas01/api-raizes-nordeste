export class ProductEntity {
  constructor(
    public readonly id: number,
    public name: string,
    public description: string | null,
    public category: string | null,
    private _isActive: boolean,
    public readonly createdAt: Date,
  ) {}

  get isActive(): boolean {
    return this._isActive;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  rename(newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error('O nome do produto não pode ser vazio.');
    }
    this.name = trimmed;
  }

  static fromPrisma(data: {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    isActive: boolean;
    createdAt: Date;
  }): ProductEntity {
    return new ProductEntity(
      data.id,
      data.name,
      data.description,
      data.category,
      data.isActive,
      data.createdAt,
    );
  }
}
