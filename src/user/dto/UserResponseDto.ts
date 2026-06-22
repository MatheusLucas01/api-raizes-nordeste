import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '../../generated/prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Maria Silva' })
  name: string;

  @ApiProperty({ example: 'maria@example.com' })
  email: string;

  @ApiProperty({ enum: ['CLIENT', 'ATTENDANT', 'KITCHEN', 'MANAGER', 'ADMIN'] })
  role: Role;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
  }
}
