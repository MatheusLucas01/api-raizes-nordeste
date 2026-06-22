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
  @IsString({ message: 'O nome deve ser um texto.' })
  name!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres.' })
  password!: string;

  @ApiProperty({
    example: true,
    description: 'O consentimento LGPD é obrigatório.',
  })
  @IsBoolean({ message: 'lgpdConsent deve ser verdadeiro ou falso.' })
  @Equals(true, { message: 'O consentimento LGPD é obrigatório.' })
  lgpdConsent!: boolean;

  @ApiProperty({
    enum: Role,
    required: false,
    description: 'Papel do usuário. Apenas ADMIN pode definir.',
  })
  @IsOptional()
  @IsEnum(Role, {
    message:
      'role deve ser um dos valores: CLIENT, ATTENDANT, KITCHEN, MANAGER, ADMIN.',
  })
  role?: Role;
}
