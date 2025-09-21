import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '@/modules/users/services/users.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return null;
    }
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    const payload = { sub: user.id, roles: user.roles, locale: user.locale };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('AUTH_ACCESS_TTL', '15m'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('AUTH_REFRESH_TTL', '7d'),
    });
    return {
      accessToken,
      refreshToken,
      user,
    };
  }
}
