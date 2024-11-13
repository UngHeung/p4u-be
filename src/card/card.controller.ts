import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/bearer-token.guard';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
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
  async getCardsByWriterId(@Req() req) {
    return this.cardService.getCardsByWriterId(req.user.id);
  }

  @Get('list')
  @UseGuards(AccessTokenGuard)
  async getCardsByAnswered(@Query('answered') answered: boolean) {
    console.log(typeof answered);
    return this.cardService.getCardsByAnswered(answered);
  }

  @Delete('delete/:id')
  @UseGuards(AccessTokenGuard)
  deleteCard(@Param('id') id: number): Promise<Card> {
    return this.cardService.deleteCard(id);
  }
}
