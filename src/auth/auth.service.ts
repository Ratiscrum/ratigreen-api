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
import { authenticator } from 'otplib';
import { UserEntity } from 'src/users/entities/user.entity';
import { toDataURL } from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { JwtTokenResponse } from './models/jwt-token-response.model';
import { PublicUser } from 'src/users/entities/public-user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login({
    email,
    password,
  }: LoginDto): Promise<{ tokens: JwtTokenResponse; user: PublicUser }> {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, refreshToken, ...publicUser } = user;

    if(isPasswordValid && user.isTwoFAEnabled) {
      return { tokens: { accessToken: "", refreshToken: "" }, user: publicUser };
    }

    const tokens = await this.getTokens(user.id, user.name);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      tokens,
      user: publicUser,
    };
  }

  async loginWithTwoFa(email: string, password: string, twoFaCode: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException();
    }
    const isPasswordValid = await this.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Wrong password");
    }

    const isCodeValid = this.isTwoFactorAuthenticationCodeValid(
      twoFaCode,
      user
    );

    if(!isCodeValid) {
      throw new UnauthorizedException("Wrong token");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, refreshToken, ...publicUser } = user;

    const tokens = await this.getTokens(user.id, user.name);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    
    return {
      tokens,
      user: publicUser,
    };
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

  async generateTwoFactorAuthenticationSecret(user: UserEntity) {
    const secret = authenticator.generateSecret();

    const otpauthUrl = authenticator.keyuri(user.email, "Ratigreen", secret);

    const truc = await this.usersService.setTwoFactorAuthenticationSecret(secret, user.id);

    console.log(truc)

    return {
      secret,
      otpauthUrl
    }
  }

  async generateQrCodeDataURL(otpAuthUrl: string) {
    return await toDataURL(otpAuthUrl);
  }

  async isCodeValid(requestUser: UserEntity, code: string) {
    const user = await this.usersService.findByEmail(requestUser.email)

    return this.isTwoFactorAuthenticationCodeValid(
      code,
      user
    );
  }

  isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, user: UserEntity) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorAuthenticationSecret
    })
  }

  async switchTwoFactorAuthentication(enable: boolean, userId: number) {
    return this.usersService.switchTwoFactorAuthentication(enable, userId);
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
