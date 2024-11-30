import { IsEmail, IsString } from 'class-validator';

export class VerifyPasswordResetDto {
  @IsString()
  account: string;

  @IsEmail()
  email: string;

  @IsString()
  resetCode: string;

  @IsString()
  newPassword: string;
}
