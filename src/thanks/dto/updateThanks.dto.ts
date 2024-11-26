import { PickType } from '@nestjs/mapped-types';
import { Thanks } from '../entity/thanks.entity';

export class UpdateThanksDto extends PickType(Thanks, ['content'] as const) {}
