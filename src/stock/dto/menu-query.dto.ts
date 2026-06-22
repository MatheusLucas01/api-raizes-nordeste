import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class MenuQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtra apenas itens disponíveis.' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'onlyAvailable deve ser verdadeiro ou falso.' })
  onlyAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Filtra por categoria do produto.' })
  @IsOptional()
  @IsString({ message: 'category deve ser um texto.' })
  category?: string;
}
