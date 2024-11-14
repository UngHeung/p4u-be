import { PickType } from '@nestjs/mapped-types';
import { Card } from '../entity/card.entity';

export class PatchCardAnsweredDto extends PickType(Card, ['isAnswered']) {}
