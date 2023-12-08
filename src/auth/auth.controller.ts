import { Controller, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Body, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common/decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Request } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refreshToken.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('two-fa/change')
  async turnOnTwoFA(@Req() request, @Body() body) { 
    const codeValid = this.authService.isCodeValid(request.user, body.twoFactorAuthenticationCode);

    if(!codeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    await this.authService.switchTwoFactorAuthentication(body.enable, request.user.id);

    return { message: "2FA enabled" }
  }

  @HttpCode(HttpStatus.OK)
  @Get('two-fa/generate')
  async generateQrCode(@Req() request) {
    const res = await this.authService.generateTwoFactorAuthenticationSecret(request.user);

    const image = await this.authService.generateQrCodeDataURL( res.otpauthUrl );

    return { image };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('two-fa/authenticate')
  async authenticate(@Body() body) {
    return this.authService.loginWithTwoFa(body.email, body.password, body.twoFaCode);
  }

  @Get('logout')
  logout(@Req() req: Request) {
    this.authService.logout(req.user['sbu']);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  refreshTokens(@Req() req: Request) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
