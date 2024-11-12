import { PickType } from '@nestjs/mapped-types';
import { User } from 'src/user/entity/user.entity';

export class SignInDto extends PickType(User, ['account', 'password']) {}
