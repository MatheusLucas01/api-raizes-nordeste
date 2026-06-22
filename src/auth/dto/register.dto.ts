import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  name!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'A senha deve conter ao menos uma letra e um número.',
  })
  password!: string;

  @ApiProperty({ example: true, description: 'O consentimento LGPD é obrigatório.' })
  @IsBoolean({ message: 'lgpdConsent deve ser verdadeiro ou falso.' })
  @Equals(true, { message: 'O consentimento LGPD é obrigatório.' })
  lgpdConsent!: boolean;
}
