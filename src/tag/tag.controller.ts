import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/bearer-token.guard';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entity/tag.entity';
import { TagService } from './tag.service';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post('new')
  @UseGuards(AccessTokenGuard)
  createTag(@Body() dto: CreateTagDto): Promise<Tag> {
    return this.tagService.createTag(dto);
  }
}
