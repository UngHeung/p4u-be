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
  async getCardsByWriterId(@Req() req): Promise<Card[]> {
    return this.cardService.getCardsByWriterId(req.user.id);
  }

  @Get()
  async getCards(): Promise<Card[]> {
    return this.cardService.getCards();
  }

  @Get('list')
  async getCardsByAnswered(
    @Query('answered') answered: boolean,
  ): Promise<Card[]> {
    return this.cardService.getCardsByAnswered(answered);
  }

  @Get('search')
  async searchCardsByKeyword(
    @Query('keyword') keyword: string,
  ): Promise<Card[]> {
    return this.cardService.searchCardsByKeyword(keyword.trim());
  }

  @Get('search/tag')
  async searchCardsByTags(
    @Query('keywords') keywords: string,
  ): Promise<Card[]> {
    return this.cardService.searchCardsByTags(keywords);
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

  @Delete('delete/:id')
  @UseGuards(AccessTokenGuard)
  deleteCard(@Param('id') id: number): Promise<Card> {
    return this.cardService.deleteCard(id);
  }
}
