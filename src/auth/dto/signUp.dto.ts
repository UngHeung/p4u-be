import { PickType } from '@nestjs/mapped-types';
import { IsEmail, IsString } from 'class-validator';
import {
  emailValidationMessage,
  stringValidationMessage,
} from 'src/common/validation/message/type-validation.message';
import { User } from 'src/user/entity/user.entity';

export class SignUpDto extends PickType(User, [
  'name',
  'account',
  'password',
]) {}
