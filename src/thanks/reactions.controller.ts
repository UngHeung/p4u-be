import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/bearer-token.guard';
import { CreateReactionDto } from './dto/createReactions.dto';
import { UpdateReactionDto } from './dto/updateReactions.dto';
import { Reaction } from './entity/reaction.entity';
import { ReactionsService } from './reactions.service';

@Controller('thanks/reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':id')
  @UseGuards(AccessTokenGuard)
  async createReaction(
    @Req() req,
    @Body() dto: CreateReactionDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Reaction> {
    return await this.reactionsService.createReaction(req.user, dto, id);
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  async getReactionsByThanksId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Reaction[]> {
    return await this.reactionsService.getReactionsByThanksId(id);
  }

  @Get('find/:id')
  @UseGuards(AccessTokenGuard)
  async findMyReaction(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Reaction> {
    return await this.reactionsService.findMyReaction(req.user, id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  async updateReaction(
    @Req() req,
    @Body() dto: UpdateReactionDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Reaction> {
    return await this.reactionsService.updateReaction(req.user, dto, id);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  async deleteReaction(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.reactionsService.deleteReaction(req.user, id);
  }
}
