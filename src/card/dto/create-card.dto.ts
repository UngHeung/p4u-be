import { PickType } from '@nestjs/mapped-types';
import { Card } from '../entity/card.entity';

export class CreateCardDto extends PickType(Card, [
  'title',
  'content',
  'tags',
]) {}
