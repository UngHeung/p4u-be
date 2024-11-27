import { IsString, Length } from 'class-validator';

export class CreateThanksDto {
  @IsString()
  @Length(2, 100)
  content: string;
}
