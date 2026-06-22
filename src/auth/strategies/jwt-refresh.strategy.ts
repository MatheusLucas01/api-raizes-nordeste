import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  AuthenticatedUserWithRefresh,
  JwtRefreshPayload,
} from '../types/jwt-payload.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: JwtRefreshPayload,
  ): Pick<AuthenticatedUserWithRefresh, 'id' | 'refreshToken'> {
    const body = req.body as { refreshToken?: string } | undefined;
    const refreshToken = body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('O refresh token não foi informado.');
    }
    return { id: payload.sub, refreshToken };
  }
}
