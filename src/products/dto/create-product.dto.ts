import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Cuscuz com Carne de Sol' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  name!: string;

  @ApiProperty({
    required: false,
    example:
      'Cuscuz nordestino acompanhado de carne de sol e manteiga de garrafa.',
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  description?: string;

  @ApiProperty({ required: false, example: 'Pratos' })
  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto.' })
  category?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive deve ser verdadeiro ou falso.' })
  isActive?: boolean;
}
