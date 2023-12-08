import { User } from '@prisma/client';

export class UserEntity implements User {
  id: number;
  email: string;
  name: string;
  password: string;
  twoFactorAuthenticationSecret: string | null;
  isTwoFAEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  refreshToken: string;
}
