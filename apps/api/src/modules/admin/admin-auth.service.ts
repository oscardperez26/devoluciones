import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AdminLoginDto } from './dto/admin-login.dto';

const TOKEN_TTL = 28800; // 8 horas

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const usuario = await this.prisma.usuarioAdmin.findFirst({
      where: { correo: dto.email, activo: true },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        passwordHash: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await compare(dto.password, usuario.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const secret = this.config.getOrThrow<string>('ADMIN_JWT_SECRET');

    const accessToken = await this.jwt.signAsync(
      { correo: usuario.correo, rol: usuario.rol },
      {
        secret,
        issuer: 'returns-admin',
        subject: usuario.id,
        expiresIn: TOKEN_TTL,
      },
    );

    return {
      accessToken,
      expiresAt: new Date(Date.now() + TOKEN_TTL * 1000).toISOString(),
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }
}
