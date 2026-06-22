import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: true,
    description: 'O consentimento LGPD é obrigatório.',
  })
  @IsBoolean()
  @Equals(true, { message: 'O consentimento LGPD é obrigatório.' })
  lgpdConsent!: boolean;

  @ApiProperty({
    enum: Role,
    required: false,
    description: 'Papel do usuário. Apenas ADMIN pode definir.',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
