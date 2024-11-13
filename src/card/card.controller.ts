import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
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

  @Delete('delete')
  @UseGuards(AccessTokenGuard)
  deleteCard(@Param('id') id: number): Promise<Card> {
    return this.cardService.deleteCard(id);
  }
}
