import { IsString, Length } from 'class-validator';

export class UpdateThanksDto {
  @IsString()
  @Length(2, 100)
  content: string;
}
