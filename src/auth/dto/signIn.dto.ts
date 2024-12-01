import { IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation/message/type-validation.message';

export class SignInDto {
  @IsString({ message: stringValidationMessage })
  account: string;

  @IsString({ message: stringValidationMessage })
  password: string;
}
