import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ProductsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtra apenas produtos ativos.' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'onlyActive deve ser verdadeiro ou falso.' })
  onlyActive?: boolean;

  @ApiPropertyOptional({ description: 'Filtra por categoria do produto.' })
  @IsOptional()
  @IsString({ message: 'category deve ser um texto.' })
  category?: string;
}
