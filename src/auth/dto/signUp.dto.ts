import { PickType } from '@nestjs/mapped-types';
import { User } from 'src/user/entity/user.entity';

export class SignUpDto extends PickType(User, [
  'name',
  'account',
  'email',
  'password',
]) {}
