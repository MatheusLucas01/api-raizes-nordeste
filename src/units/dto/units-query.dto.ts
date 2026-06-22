import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class UnitsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtra apenas unidades ativas.' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'onlyActive deve ser verdadeiro ou falso.' })
  onlyActive?: boolean;
}
