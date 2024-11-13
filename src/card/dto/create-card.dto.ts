import { PickType } from '@nestjs/mapped-types';
import { IsArray, IsNotEmpty } from 'class-validator';
import { Card } from '../entity/card.entity';

export class CreateCardDto extends PickType(Card, ['title', 'content']) {
  @IsArray()
  @IsNotEmpty()
  keywords: string[];
}
