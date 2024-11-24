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
    @Query('take') take: string,
    @Query('cursor') cursor: string,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.getCardsByWriterId(req.user.id, +take, +cursor);
  }

  @Get()
  async getCards(
    @Query('take') take: string,
    @Query('cursor') cursor: string,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.getCards(+take, +cursor);
  }

  @Get('answered')
  async getCardsByAnswered(
    @Query('answered') answered: boolean,
    @Query('take') take: string,
    @Query('cursor') cursor: string,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.getCardsByAnswered(answered, +take, +cursor);
  }

  @Get('search')
  async searchCardsByKeyword(
    @Query('keyword') keyword: string,
    @Query('take') take: string,
    @Query('cursor') cursor: string,
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
    @Query('take') take: string,
    @Query('cursor') cursor: string,
  ): Promise<{ list: Card[]; cursor: number }> {
    return this.cardService.searchCardsByTags(keyword, +take, +cursor);
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

  @Delete('delete/:id')
  @UseGuards(AccessTokenGuard)
  deleteCard(@Param('id') id: number): Promise<Card> {
    return this.cardService.deleteCard(id);
  }
}
