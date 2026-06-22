import { ApiProperty } from '@nestjs/swagger';
import { Unit } from '../../generated/prisma/client';

export class UnitResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Filial Recife - Boa Viagem' })
  name: string;

  @ApiProperty({ example: 'Av. Boa Viagem, 1000, Recife/PE' })
  address: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(unit: Unit) {
    this.id = unit.id;
    this.name = unit.name;
    this.address = unit.address;
    this.isActive = unit.isActive;
    this.createdAt = unit.createdAt;
    this.updatedAt = unit.updatedAt;
  }
}
