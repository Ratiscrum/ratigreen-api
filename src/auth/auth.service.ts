import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { JwtTokenResponse } from './models/jwt-token-response.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login({ email, password }: LoginDto): Promise<JwtTokenResponse> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException();
    }
    const isPasswordValid = await this.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    // const payload = { sub: user.id, name: user.name, email: user.email };

    // return {
    //   access_token: await this.jwtService.signAsync(payload),
    // };
    const tokens = await this.getTokens(user.id, user.name);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async register({
    email,
    name,
    password,
  }: RegisterDto): Promise<JwtTokenResponse> {
    const userExist = await this.usersService.findByEmail(email);
    if (userExist) throw new UnauthorizedException();

    const hash = await this.hashData(password);

    const newUser = await this.usersService.create({
      email,
      name,
      password: hash,
    });

    const tokens = await this.getTokens(newUser.id, newUser.name);
    await this.updateRefreshToken(newUser.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    return this.usersService.update(userId, { refreshToken: null });
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access Denied');

    const isRefreshTokenValid = await this.validatePassword(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) throw new ForbiddenException('Access Denied');
    const tokens = await this.getTokens(user.id, user.name);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  private async validatePassword(
    password: string,
    userPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, userPassword);
  }

  private async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(data, salt);
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  private async getTokens(userId: number, username: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
