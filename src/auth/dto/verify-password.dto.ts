import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { lengthValidationMessage } from 'src/common/validation/message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation/message/type-validation.message';

export class VerifyPasswordResetDto {
  @IsString()
  account: string;

  @IsEmail()
  email: string;

  @IsString()
  resetCode: string;

  @Length(8, 12, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%]).{8,}$/g, {
    message:
      'password은(는) 영문 대소문자, 특수문자를 하나씩 포함하여 입력해주세요.',
  })
  newPassword: string;
}
