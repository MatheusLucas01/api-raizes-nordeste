import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/CreateUserDto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from './dto/UserResponseDto';
import { Prisma, Role } from '../generated/prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const { name, email, password, lgpdConsent, role } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          lgpdConsent,
          role: role ?? Role.CLIENT,
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

  async getAllUsers(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => new UserResponseDto(u)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return new UserResponseDto(user);
  }

  async deleteUser(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
      }
      throw error;
    }
  }
}
