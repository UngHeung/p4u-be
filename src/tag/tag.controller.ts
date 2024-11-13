import { Body, Controller, Post } from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entity/tag.entity';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post('new')
  createTag(@Body() dto: CreateTagDto): Promise<Tag> {
    return this.tagService.createTag(dto);
  }
}
