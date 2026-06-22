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
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'A senha deve conter ao menos uma letra e um número.',
  })
  password!: string;

  @ApiProperty({ example: true, description: 'O consentimento LGPD é obrigatório.' })
  @IsBoolean()
  @Equals(true, { message: 'O consentimento LGPD é obrigatório.' })
  lgpdConsent!: boolean;
}
