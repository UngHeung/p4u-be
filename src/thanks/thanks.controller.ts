import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/bearer-token.guard';
import { CreateThanksDto } from './dto/createThanks.dto';
import { UpdateThanksDto } from './dto/updateThanks.dto';
import { Thanks } from './entity/thanks.entity';
import { ThanksService } from './thanks.service';

@Controller('thanks')
export class ThanksController {
  constructor(private readonly thanksService: ThanksService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  createThanks(@Req() req, @Body() dto: CreateThanksDto): Promise<Thanks> {
    return this.thanksService.createThanks(req.user, dto);
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  getThanksList(
    @Query('type') type: 'all' | 'my',
    @Query('take') take: number,
    @Query('cursor') cursor: number,
    @Query('userId') userId?: number,
  ): Promise<{ list: Thanks[]; cursor: number }> {
    return this.thanksService.getThanksList(type, take, cursor, userId);
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  getThanks(@Param('id') id: number): Promise<Thanks> {
    return this.thanksService.getThanks(id);
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard)
  updateThanks(
    @Req() req,
    @Param('id') id: number,
    @Body() thanks: UpdateThanksDto,
  ): Promise<Thanks> {
    return this.thanksService.updateThanks(req.user.id, id, thanks);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  deleteThanks(@Req() req, @Param('id') id: number): Promise<boolean> {
    return this.thanksService.deleteThanks(req.user.id, id);
  }
}
