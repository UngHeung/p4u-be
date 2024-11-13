import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { Card } from './entity/card.entity';

@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('new')
  async createCard(@Body() dto: CreateCardDto): Promise<Card> {
    return this.cardService.createCard(dto);
  }

  @Delete('delete')
  deleteCard(@Param('id') id: number): Promise<Card> {
    return this.cardService.deleteCard(id);
  }
}
