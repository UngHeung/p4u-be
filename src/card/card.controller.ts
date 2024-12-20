import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/bearer-token.guard';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { PatchCardAnsweredDto } from './dto/patch-card-answered.dto';
import { Card } from './entity/card.entity';

@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('new')
  @UseGuards(AccessTokenGuard)
  async createCard(@Req() req, @Body() dto: CreateCardDto): Promise<Card> {
    return this.cardService.createCard(req.user, dto);
  }

  @Get('my')
  @UseGuards(AccessTokenGuard)
  async getCardsByWriterId(
    @Req() req,
    @Query('take', ParseIntPipe) take: number,
    @Query('cursor', ParseIntPipe) cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.getCardsByWriterId(req.user.id, take, cursor);
  }

  @Get()
  async getCards(
    @Query('type')
    type: 'all' | 'inactive' = 'all',
    @Query('take', ParseIntPipe) take: number,
    @Query('cursor', ParseIntPipe) cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.getCards(type, take, cursor);
  }

  @Get('answered')
  async getCardsByAnswered(
    @Query('answered') answered: boolean,
    @Query('take', ParseIntPipe) take: number,
    @Query('cursor', ParseIntPipe) cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.getCardsByAnswered(answered, +take, +cursor);
  }

  @Get('search')
  async searchCardsByKeyword(
    @Query('keyword') keyword: string,
    @Query('take', ParseIntPipe) take: number,
    @Query('cursor', ParseIntPipe) cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.searchCardsByKeyword(
      keyword.trim(),
      +take,
      +cursor,
    );
  }

  @Get('search/tag')
  async searchCardsByTags(
    @Query('keyword') keyword: string,
    @Query('take', ParseIntPipe) take: number,
    @Query('cursor', ParseIntPipe) cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.searchCardsByTags(keyword, take, cursor);
  }

  @Get('random')
  @UseGuards(AccessTokenGuard)
  async getRandomCard(): Promise<Card> {
    return this.cardService.getRandomCard();
  }

  @Patch(':id/answered')
  @UseGuards(AccessTokenGuard)
  async patchCardAnswered(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchCardAnsweredDto,
  ): Promise<{ isAnswered: boolean }> {
    return this.cardService.patchCardAnswered(req.user, id, dto);
  }

  @Patch(':id/pick')
  @UseGuards(AccessTokenGuard)
  async togglePickedCard(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Card> {
    return this.cardService.togglePickedCard(req.user, id);
  }

  @Patch(':id/report')
  @UseGuards(AccessTokenGuard)
  async reportCard(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Card> {
    return this.cardService.reportCard(req.user, id);
  }

  @Patch(':id/reporter/reset')
  @UseGuards(AccessTokenGuard)
  async resetReportedCard(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Card> {
    return this.cardService.resetReportedCard(id);
  }

  @Patch(':id/activate')
  @UseGuards(AccessTokenGuard)
  async toggleActivateCard(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Card> {
    return this.cardService.toggleActivateCard(id);
  }

  @Delete(':id/delete')
  @UseGuards(AccessTokenGuard)
  deleteCard(@Param('id', ParseIntPipe) id: number): Promise<Card> {
    return this.cardService.deleteCard(id);
  }
}
