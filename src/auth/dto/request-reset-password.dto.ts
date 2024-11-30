import { IsEmail, IsString } from 'class-validator';

export class RequestPasswordResetDto {
  @IsString()
  account: string;

  @IsEmail()
  email: string;
}
