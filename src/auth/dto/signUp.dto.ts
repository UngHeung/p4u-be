import { IsEmail, IsString } from 'class-validator';
import {
  emailValidationMessage,
  stringValidationMessage,
} from 'src/common/validation/message/type-validation.message';

export class SignUpDto {
  @IsString({ message: stringValidationMessage })
  name: string;

  @IsString({ message: stringValidationMessage })
  account: string;

  @IsString({ message: stringValidationMessage })
  password: string;
}
