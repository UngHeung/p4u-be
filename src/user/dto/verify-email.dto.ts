import { IsEmail, IsOptional, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsOptional()
  account: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  code: string;
}
