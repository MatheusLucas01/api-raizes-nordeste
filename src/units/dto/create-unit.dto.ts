import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, MinLength } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'Filial Recife - Boa Viagem' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  name!: string;

  @ApiProperty({ example: 'Av. Boa Viagem, 1000, Recife/PE' })
  @IsString({ message: 'O endereço deve ser um texto.' })
  @MinLength(5, { message: 'O endereço deve ter ao menos 5 caracteres.' })
  address!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive deve ser verdadeiro ou falso.' })
  isActive?: boolean;
}
