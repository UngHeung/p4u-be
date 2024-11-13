import { PickType } from '@nestjs/mapped-types';
import { Tag } from '../entity/tag.entity';

export class CreateTagDto extends PickType(Tag, ['keyword']) {}
