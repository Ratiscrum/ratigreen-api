import { PickType } from '@nestjs/mapped-types';
import { UserEntity } from 'src/users/entities/user.entity';

export class RegisterDto extends PickType(UserEntity, [
  'email',
  'name',
  'password',
]) {}
