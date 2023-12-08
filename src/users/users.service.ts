import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { PublicUser } from './entities/public-user.entity';
import { PrismaService } from 'src/services/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<UserEntity> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(user: RegisterDto): Promise<PublicUser> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = await this.prisma.user.create({
      data: {
        ...user,
        refreshToken: null,
      },
    });

    return result;
  }

  async setTwoFactorAuthenticationSecret(secret: string, userId: number) {
    return this.prisma.user.update({
      data: { twoFactorAuthenticationSecret: secret },
      where: { id: userId }
    });
  }

  async switchTwoFactorAuthentication(value: boolean, userId: number) {
    return this.prisma.user.update({
      data: { isTwoFAEnabled: value },
      where: { id: userId }
    });
  }
  
  async update(userId: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateUserDto.name && { name: updateUserDto.name }),
        ...(updateUserDto.refreshToken && {
          refreshToken: updateUserDto.refreshToken,
        }),
      },
    });
  }
}
