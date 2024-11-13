import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Tag } from 'src/tag/entity/tag.entity';
import { TagModule } from 'src/tag/tag.module';
import { UserModule } from 'src/user/user.module';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { Card } from './entity/card.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, Tag]),
    UserModule,
    AuthModule,
    TagModule,
  ],
  exports: [CardService],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
