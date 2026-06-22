import { Role } from '../../generated/prisma/client';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

export interface JwtRefreshPayload {
  sub: number;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
}

export interface AuthenticatedUserWithRefresh extends AuthenticatedUser {
  refreshToken: string;
}
