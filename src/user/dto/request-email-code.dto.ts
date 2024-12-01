import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RequestEmailCodeDto {
  @IsEmail()
  email: string;
}
