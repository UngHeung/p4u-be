import { PickType } from '@nestjs/mapped-types';
import { IsArray, IsBoolean, IsNotEmpty } from 'class-validator';
import { Card } from '../entity/card.entity';

export class CreateCardDto extends PickType(Card, ['title', 'content']) {
  @IsArray()
  @IsNotEmpty()
  keywords: string[];

  @IsBoolean()
  isAnonymity?: boolean;
}
