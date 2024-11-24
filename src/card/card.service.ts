import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseModel } from 'src/common/entity/base.entity';
import { TagService } from 'src/tag/tag.service';
import { User } from 'src/user/entity/user.entity';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
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
    logger.log('===== card.service.createCard =====');
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

  async getCardsByWriterId(
    id: number,
    take: number,
    cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    logger.log('===== card.service.getCardsByWriterId =====');

    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.writer', 'writer')
      .leftJoin('card.pickers', 'pickers')
      .leftJoin('card.tags', 'tags')
      .where('writer.id = :id', { id })
      .andWhere('card.id > :cursor', { cursor })
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
      .limit(take + 1)
      .getMany();

    if (!cards) {
      logger.log(`카드가 존재하지 않습니다.`);
      return { list: [], cursor: null };
    }

    logger.log('카드 목록 반환이 완료되었습니다.');

    if (cards.length > take) {
      return { list: cards.slice(0, take), cursor: cards[cards.length - 2].id };
    } else {
      return { list: cards, cursor: null };
    }
  }

  async getCards(
    take: number,
    cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    logger.log('===== card.service.getCards =====');

    const cards = await this.cursorPaginateCard('all', take, cursor);

    if (!cards.list.length) {
      logger.log(`카드가 존재하지 않습니다.`);
      return { list: [], cursor: null };
    }

    logger.log('카드 목록 반환이 완료되었습니다.');

    return cards;
  }

  async getCardsByAnswered(
    isAnswered: boolean,
    take: number,
    cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    logger.log('===== card.service.getCardsByAnswered =====');

    const cards = await this.cursorPaginateCard(
      'my',
      take,
      cursor,
      '',
      isAnswered,
    );

    if (!cards.list.length) {
      logger.log(`카드가 존재하지 않습니다.`);
      return { list: [], cursor: null };
    }

    logger.log('카드 목록 반환이 완료되었습니다.');

    return cards;
  }

  async searchCardsByKeyword(
    keyword: string,
    take: number,
    cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    logger.log('===== card.service.searchCardsByKeyword =====');
    logger.log(`입력된 검색 키워드 : ${keyword}`);

    const cards = await this.cursorPaginateCard(
      'search',
      take,
      cursor,
      keyword,
    );

    if (!cards.list.length) {
      logger.log(`카드가 존재하지 않습니다.`);
      return { list: [], cursor: null };
    }

    logger.log('검색된 카드목록 반환이 완료되었습니다.');

    return cards;
  }

  async searchCardsByTags(
    keywords: string,
    take: number,
    cursor: number,
  ): Promise<{ list: Card[]; cursor: number }> {
    logger.log('===== card.service.searchCardsByTags =====');

    const keywordList = keywords.split('_');
    logger.log(`선택된 태그 키워드 : ${keywordList.toString()}`);

    const cardsIds = await this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.tags', 'tags')
      .leftJoin('card.pickers', 'pickers')
      .where('tags.keyword IN (:...keywords)', {
        keywords: keywordList,
      })
      .andWhere(`card.id ${cursor >= 0 ? '<' : '>'} :cursor`, { cursor })
      .select(['card.id', 'card.isAnswered', 'pickers.id'])
      .take(take + 1)
      .groupBy('card.id, pickers.id')
      .having('COUNT(DISTINCT tags.keyword) = :count', {
        count: keywordList.length,
      })
      .getMany();

    if (!cardsIds.length) {
      logger.warn('검색된 카드가 없습니다.');

      return { list: [], cursor: -1 };
    } else {
      const idList: number[] = [];
      cardsIds.forEach(card => idList.push(card.id));

      const cards = await this.cursorPaginateCard(
        'tag',
        take,
        cursor,
        '',
        false,
        idList,
      );

      logger.log('검색된 카드목록 반환이 완료되었습니다.');

      return cards;
    }
  }

  // 랜덤 카드 하나를 반환
  async getRandomCard(): Promise<Card> {
    logger.log('===== card.service.getRandomCard =====');
    const lastCardId = await this.cardRepository.find({
      order: { id: 'DESC' },
      select: ['id'],
    });

    logger.log(`카드 목록의 마지막 아이디 : ${lastCardId[0].id}`);

    while (true) {
      const randomId = Math.floor(Math.random() * lastCardId[0].id + 1);
      logger.log(`랜덤 아이디 : ${randomId}`);

      const card = await this.cardRepository
        .createQueryBuilder('card')
        .leftJoin('card.pickers', 'pickers')
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
          'pickers.id',
        ])
        .where('card.isAnswered = :isAnswered', { isAnswered: false })
        .andWhere('card.id = :randomId', { randomId })
        .getOne();

      if (card) {
        logger.log('카드가 존재합니다.');
        logger.log('카드 반환이 완료되었습니다.');
        return card;
      }
    }
  }

  async patchCardAnswered(
    user: User,
    cardId: number,
    dto: PatchCardAnsweredDto,
  ): Promise<{ isAnswered: boolean }> {
    logger.log('===== card.service.patchCardAnswered =====');

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

  async togglePickedCard(user: User, id: number): Promise<Card> {
    logger.log('===== card.service.togglePickedCard =====');

    const card = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.pickers', 'pickers')
      .where('card.id = :id', { id })
      .select(['card.id', 'pickers.id'])
      .getOne();

    if (!card) {
      logger.warn(`${id} - 카드가 존재하지 않습니다.`);
      throw new NotFoundException('카드가 존재하지 않습니다.');
    }

    const pickers = card.pickers;
    const currLen = pickers.length;

    let newPickers = pickers.filter(picker => picker.id !== user.id);

    if (currLen === newPickers.length) {
      newPickers = [...pickers, user];
      logger.log(`${user.id} - 카드에 새로운 picker가 추가되었습니다.`);
    } else {
      logger.log(`${user.id} - 카드에서 해당 picker가 제거되었습니다.`);
    }

    card.pickers = newPickers;

    this.cardRepository.save(card);
    logger.log(`${id} - 카드에 새로운 정보가 갱신되었습니다.`);

    return card;
  }

  async deleteCard(id: number) {
    logger.log('===== card.service.deleteCard =====');

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

  async cursorPaginateCard(
    type: 'all' | 'my' | 'tag' | 'search',
    take: number,
    cursor: number,
    keyword?: string,
    isAnswered?: boolean,
    ids?: number[],
  ): Promise<{ list: Card[]; cursor: number }> {
    const queryBuilder = this.composeQueryBuilder<Card>(
      this.cardRepository,
      type,
      cursor,
      isAnswered,
      keyword,
      ids,
    );

    queryBuilder
      .leftJoin('card.writer', 'writer')
      .leftJoin('card.pickers', 'pickers')
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
        'pickers.id',
      ])
      .orderBy('card.id', 'DESC')
      .take(take + 1);

    const cards = await queryBuilder.getMany();
    const hasNext = cards.length > take;

    if (hasNext) {
      return { list: cards.slice(0, take), cursor: cards[cards.length - 2].id };
    } else {
      return { list: cards, cursor: null };
    }
  }

  composeQueryBuilder<T extends BaseModel>(
    repo: Repository<T>,
    type: 'all' | 'my' | 'search' | 'tag',
    cursor: number,
    isAnswered?: boolean,
    keyword?: string,
    ids?: number[],
  ): SelectQueryBuilder<T> {
    const queryBuilder = repo.createQueryBuilder('card');

    if (cursor) {
      if (type === 'my') {
        queryBuilder.where('card.isAnswered = :isAnswered', {
          isAnswered: isAnswered,
        });
      } else if (type === 'tag') {
        queryBuilder.where('card.id IN (:...ids)', { ids });
      } else if (type === 'search') {
        queryBuilder.where(
          'card.title ILIKE :keyword OR card.content ILIKE :keyword',
          {
            keyword: `%${keyword}%`,
          },
        );
      }

      queryBuilder.andWhere(`card.id ${cursor >= 0 ? '<' : '>'} :cursor`, {
        cursor,
      });
    }

    return queryBuilder;
  }
}
