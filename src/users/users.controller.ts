import { Controller, Get, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const { password, refreshToken, ...user } =
      await this.usersService.findById(req.user.sub);
    return user;
  }
}
