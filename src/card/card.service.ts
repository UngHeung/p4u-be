import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from 'src/tag/entity/tag.entity';
import { TagService } from 'src/tag/tag.service';
import { DataSource, Repository } from 'typeorm';
import { CreateCardDto } from './dto/create-card.dto';
import { Card } from './entity/card.entity';

const logger = new Logger();

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly tagService: TagService,
    private readonly dataSource: DataSource,
  ) {}

  async createCard(dto: CreateCardDto): Promise<Card> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tags: Tag[] = await Promise.all(
        dto.tags.map(async tag => await this.tagService.createTag(tag)),
      );

      const card = this.cardRepository.create({ ...dto, tags });

      await this.cardRepository.save(card);

      logger.log(`${card.id} - 카드가 생성되었습니다.`);
      await queryRunner.commitTransaction();

      return card;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error(error);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteCard(id: number) {
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .where('id = :id', { id })
      .leftJoinAndSelect('card.tags', 'tags')
      .leftJoinAndSelect('tags.cards', 'tagCards')
      .select(['card.id', 'tag.id', 'tagCards.id'])
      .getOne();

    if (!card) {
      logger.warn(`${id} - 카드가 존재하지 않습니다.`);
      throw new NotFoundException(`카드가 존재하지 않습니다.`);
    }

    card.tags.forEach(tag => {
      this.tagService.deleteTag(tag.id);
    });

    await this.cardRepository.delete({ id });

    logger.log(`${id} - 카드가 삭제되었습니다.`);

    return card;
  }
}
