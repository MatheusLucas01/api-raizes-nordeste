import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, User } from '../generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../user/dto/UserResponseDto';
import { JwtPayload, JwtRefreshPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  private readonly bcryptRounds = 10;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    this.accessExpiresIn = config.get<string>('JWT_EXPIRES_IN', '15m');
    this.refreshExpiresIn = config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          lgpdConsent: dto.lgpdConsent,
          role: Role.CLIENT,
        },
      });
      return new UserResponseDto(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email já registrado.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.issueTokens(user);
  }

  async refresh(
    userId: number,
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Acesso negado.');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Acesso negado.');
    }

    return this.issueTokens(user);
  }

  async logout(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async getMe(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return new UserResponseDto(user);
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = { sub: user.id };

    const accessTtl = this.toSeconds(this.accessExpiresIn);
    const refreshTtl = this.toSeconds(this.refreshExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: accessTtl,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl,
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, this.bcryptRounds);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessTtl,
      user: new UserResponseDto(user),
    };
  }

  private toSeconds(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 900;
    const n = parseInt(match[1], 10);
    const unit = match[2];
    const map: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return n * map[unit];
  }
}
