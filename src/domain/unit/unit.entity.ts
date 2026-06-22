export class UnitEntity {
  constructor(
    public readonly id: number,
    public name: string,
    public address: string,
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
      throw new Error('O nome da unidade não pode ser vazio.');
    }
    this.name = trimmed;
  }

  updateAddress(newAddress: string): void {
    const trimmed = newAddress.trim();
    if (!trimmed) {
      throw new Error('O endereço da unidade não pode ser vazio.');
    }
    this.address = trimmed;
  }

  static fromPrisma(data: {
    id: number;
    name: string;
    address: string;
    isActive: boolean;
    createdAt: Date;
  }): UnitEntity {
    return new UnitEntity(
      data.id,
      data.name,
      data.address,
      data.isActive,
      data.createdAt,
    );
  }
}
