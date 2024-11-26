import { PickType } from '@nestjs/mapped-types';
import { Thanks } from '../entity/thanks.entity';

export class CreateThanksDto extends PickType(Thanks, ['content']) {}
