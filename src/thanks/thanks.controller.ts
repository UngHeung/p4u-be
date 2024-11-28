import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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

  @Post('new')
  @UseGuards(AccessTokenGuard)
  createThanks(@Req() req, @Body() dto: CreateThanksDto): Promise<Thanks> {
    return this.thanksService.createThanks(req.user, dto);
  }

  @Get('list')
  @UseGuards(AccessTokenGuard)
  getThanksList(
    @Req() req,
    @Query('type') type: 'all' | 'my',
    @Query('take', ParseIntPipe) take: number,
    @Query('cursor', ParseIntPipe) cursor: number,
  ): Promise<{ list: Thanks[]; cursor: number }> {
    return this.thanksService.getThanksList(req.user.id, type, take, cursor);
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  getThanks(@Param('id', ParseIntPipe) id: number): Promise<Thanks> {
    return this.thanksService.getThanks(id);
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard)
  updateThanks(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateThanksDto,
  ): Promise<Thanks> {
    return this.thanksService.updateThanks(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  deleteThanks(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<boolean> {
    return this.thanksService.deleteThanks(req.user.id, id);
  }
}
