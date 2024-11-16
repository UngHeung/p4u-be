import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TagService } from 'src/tag/tag.service';
import { User } from 'src/user/entity/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateCardDto } from './dto/create-card.dto';
import { PatchCardAnsweredDto } from './dto/patch-card-answered.dto';
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

  async createCard(user: User, dto: CreateCardDto): Promise<Card> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const card = this.cardRepository.create({
        ...dto,
        tags: [],
        writer: user,
      });

      if (!dto.keywords.length) {
        logger.warn('최소 1개의 태그가 필요합니다.');
        throw new BadRequestException('최소 1개의 태그가 필요합니다.');
      }

      card.tags = await Promise.all(
        dto.keywords.map(async keyword => {
          const tag = await this.tagService.getTagByKeyword(keyword);

          if (tag) {
            return tag;
          } else {
            return await this.tagService.createTag({ keyword });
          }
        }),
      );

      await this.cardRepository.save(card);

      logger.log(`${card.id} - 카드가 생성되었습니다.`);
      await queryRunner.commitTransaction();

      return card;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.status === 400) {
        logger.log(`잘못된 값이 입력되었습니다.`);
        throw new BadRequestException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async getCardsByWriterId(id: number): Promise<Card[]> {
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.writer', 'writer')
      .leftJoin('card.pickers', 'pickers')
      .leftJoin('card.tags', 'tags')
      .where('writer.id = :id', { id })
      .select([
        'card.id',
        'card.title',
        'card.content',
        'card.isAnonymity',
        'card.isAnswered',
        'tags.id',
        'tags.keyword',
        'writer.id',
        'writer.name',
        'pickers.id',
      ])
      .orderBy('card.id', 'DESC')
      .getMany();

    if (!cards) {
      logger.log(`카드가 존재하지 않습니다.`);
      return [];
    }

    logger.log('카드 목록 반환이 완료되었습니다.');

    return cards;
  }

  async getCards(): Promise<Card[]> {
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.writer', 'writer')
      .leftJoin('card.tags', 'tags')
      .select([
        'card.id',
        'card.title',
        'card.content',
        'card.isAnonymity',
        'card.isAnswered',
        'tags.id',
        'tags.keyword',
        'writer.id',
        'writer.name',
      ])
      .orderBy('card.id', 'DESC')
      .getMany();

    if (!cards) {
      logger.log(`카드가 존재하지 않습니다.`);
      return [];
    }

    logger.log('카드 목록 반환이 완료되었습니다.');

    return cards;
  }

  async getCardsByAnswered(isAnswered: boolean): Promise<Card[]> {
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.writer', 'writer')
      .leftJoin('card.tags', 'tags')
      .where('card.isAnswered = :isAnswered', { isAnswered })
      .select([
        'card.id',
        'card.title',
        'card.content',
        'card.isAnonymity',
        'card.isAnswered',
        'tags.id',
        'tags.keyword',
        'writer.id',
        'writer.name',
      ])
      .orderBy('card.id', 'DESC')
      .getMany();

    if (!cards) {
      logger.log(`카드가 존재하지 않습니다.`);
      return [];
    }

    logger.log('카드 목록 반환이 완료되었습니다.');

    return cards;
  }

  async searchCardsByKeyword(keyword: string): Promise<Card[]> {
    logger.log(`입력된 검색 키워드 : ${keyword}`);

    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.tags', 'tags')
      .leftJoin('card.writer', 'writer')
      .leftJoin('card.pickers', 'pickers')
      .where('card.title ILIKE :keyword OR card.content ILIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .select([
        'tags.id',
        'tags.keyword',
        'writer.id',
        'writer.name',
        'card.id',
        'card.title',
        'card.content',
        'card.isAnonymity',
        'card.isAnswered',
        'pickers.id',
      ])
      .orderBy('card.id', 'DESC')
      .getMany();

    if (!cards) {
      logger.warn('검색된 카드가 없습니다.');
    }

    logger.log('검색된 카드목록 반환이 완료되었습니다.');
    return cards;
  }

  async searchCardsByTags(keywords: string): Promise<Card[]> {
    const keywordList = keywords.split('_');
    logger.log(`선택된 태그 키워드 : ${keywordList.toString()}`);

    const cardsIds = await this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.tags', 'tags')
      .where('tags.keyword IN (:...keywords)', { keywords: keywordList })
      .select('card.id')
      .groupBy('card.id')
      .having('COUNT(DISTINCT tags.keyword) = :count', {
        count: keywordList.length,
      })
      .getMany();

    if (!cardsIds.length) {
      logger.warn('검색된 카드가 없습니다.');

      return [];
    } else {
      const idList: number[] = [];
      cardsIds.forEach(card => idList.push(card.id));

      const cards = await this.cardRepository
        .createQueryBuilder('card')
        .leftJoin('card.tags', 'tags')
        .leftJoin('card.writer', 'writer')
        .leftJoin('card.pickers', 'pickers')
        .where('card.id IN (:...ids)', { ids: idList })
        .select([
          'card.id',
          'card.title',
          'card.content',
          'card.isAnonymity',
          'card.isAnswered',
          'tags.id',
          'tags.keyword',
          'writer.id',
          'writer.name',
          'pickers.id',
        ])
        .orderBy('card.id', 'DESC')
        .getMany();

      logger.log('검색된 카드목록 반환이 완료되었습니다.');
      return cards;
    }
  }

  async patchCardAnswered(
    user: User,
    cardId: number,
    dto: PatchCardAnsweredDto,
  ): Promise<{ isAnswered: boolean }> {
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.id = :cardId', { cardId })
      .leftJoin('card.writer', 'writer')
      .select(['card.id', 'card.isAnswered', 'writer.id'])
      .getOne();

    if (user.id !== card.writer.id) {
      logger.warn('본인의 카드가 아닙니다.');
      throw new UnauthorizedException('본인의 카드가 아닙니다.');
    }

    if (!card) {
      logger.warn(`${cardId} - 카드가 존재하지 않습니다.`);
      throw new NotFoundException('카드가 존재하지 않습니다.');
    }

    card.isAnswered = dto.isAnswered;

    await this.cardRepository.save(card);

    logger.log(`${cardId} - 카드의 isAnswered 항목이 변경되었습니다.`);

    return { isAnswered: card.isAnswered };
  }

  async deleteCard(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const card = await this.cardRepository
        .createQueryBuilder('card')
        .where('card.id = :id', { id })
        .leftJoin('card.tags', 'tags')
        .select(['card.id', 'tags.id'])
        .getOne();

      if (!card) {
        logger.warn(`${id} - 카드가 존재하지 않습니다.`);
        throw new NotFoundException(`카드가 존재하지 않습니다.`);
      }

      if (card.tags.length) {
        card.tags.forEach(tag => {
          this.tagService.deleteTag(tag.id);
        });
      }

      await this.cardRepository.delete({ id });

      logger.log(`${id} - 카드가 삭제되었습니다.`);

      return card;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.status === 404) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      await queryRunner.release();
    }
  }
}
