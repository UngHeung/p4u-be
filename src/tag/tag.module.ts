import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardModule } from 'src/card/card.module';
import { Tag } from './entity/tag.entity';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag]), CardModule],
  exports: [TagService],
  controllers: [TagController],
  providers: [TagService],
})
export class TagModule {}
