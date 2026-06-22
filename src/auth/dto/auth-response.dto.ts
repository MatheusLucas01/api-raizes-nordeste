import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../user/dto/UserResponseDto';

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: 900, description: 'Tempo de vida do token de acesso em segundos.' })
  expiresIn!: number;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
