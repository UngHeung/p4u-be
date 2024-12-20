import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/bearer-token.guard';
import { DeleteResult } from 'typeorm';
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

  @Get('best')
  getBestTagList(): Promise<Tag[]> {
    return this.tagService.getBestTagList();
  }

  @Get('keyword')
  getTagListByKeyword(@Query('keyword') keyword: string): Promise<Tag[]> {
    return this.tagService.getTagListByKeyword(keyword);
  }

  @Delete('clear')
  @UseGuards(AccessTokenGuard)
  deleteTags(@Req() req): Promise<DeleteResult[]> {
    return this.tagService.clearTag(req.user);
  }
}
