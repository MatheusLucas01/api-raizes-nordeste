import { Role } from '../../generated/prisma/client';

export class UserEntity {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public name: string,
    private _role: Role,
    private _loyaltyPoints: number,
    public readonly lgpdConsent: boolean,
    public readonly createdAt: Date,
  ) {}

  get role(): Role {
    return this._role;
  }

  get loyaltyPoints(): number {
    return this._loyaltyPoints;
  }

  isStaff(): boolean {
    return this._role !== Role.CLIENT;
  }

  isAdmin(): boolean {
    return this._role === Role.ADMIN;
  }

  hasEnoughPoints(amount: number): boolean {
    return this._loyaltyPoints >= amount;
  }

  addPoints(amount: number): void {
    if (amount < 0) {
      throw new Error('Não é possível adicionar uma quantidade negativa de pontos de fidelidade.');
    }
    this._loyaltyPoints += amount;
  }

  redeemPoints(amount: number): void {
    if (amount < 0) {
      throw new Error('Não é possível resgatar uma quantidade negativa de pontos de fidelidade.');
    }
    if (!this.hasEnoughPoints(amount)) {
      throw new Error('Saldo de pontos de fidelidade insuficiente.');
    }
    this._loyaltyPoints -= amount;
  }

  changeRole(newRole: Role): void {
    this._role = newRole;
  }

  static fromPrisma(data: {
    id: number;
    email: string;
    name: string;
    role: Role;
    loyaltyPoints: number;
    lgpdConsent: boolean;
    createdAt: Date;
  }): UserEntity {
    return new UserEntity(
      data.id,
      data.email,
      data.name,
      data.role,
      data.loyaltyPoints,
      data.lgpdConsent,
      data.createdAt,
    );
  }
}
