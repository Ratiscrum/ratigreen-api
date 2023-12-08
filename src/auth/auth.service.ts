import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { PublicUser } from 'src/users/entities/public-user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { authenticator } from 'otplib';
import { UserEntity } from 'src/users/entities/user.entity';
import { toDataURL } from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login({
    email,
    password,
  }: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(email);

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

    if(isPasswordValid && user.isTwoFAEnabled) {
      return { access_token: "" };
    }

    const payload = { id: user.id, name: user.name, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async loginWithTwoFa(email: string, password: string, twoFaCode: string) {
    const user = await this.usersService.findOne(email);

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

    const payload = { id: user.id, name: user.name, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register({ email, name, password }: RegisterDto): Promise<PublicUser> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    return this.usersService.create({
      email,
      name,
      password: hash,
    });
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
    const user = await this.usersService.findOne(requestUser.email)

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
}
