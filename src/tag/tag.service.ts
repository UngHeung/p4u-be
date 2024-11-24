import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entity/tag.entity';

const logger = new Logger();

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async getTagByKeyword(keyword: string): Promise<Tag> {
    logger.log(`===== tag.service.getTagByKeyword =====`);

    const tag = await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.keyword = :keyword', { keyword })
      .select(['tag.id', 'tag.keyword'])
      .getOne();

    if (!tag) {
      logger.warn(`${keyword} - 태그가 존재하지 않습니다.`);
    }

    return tag;
  }

  async getBestTagList(): Promise<Tag[]> {
    logger.log(`===== tag.service.getBestTagList =====`);

    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.cards', 'cards')
      .select(['tag.id', 'tag.keyword'])
      .addSelect('COUNT(DISTINCT cards.id)', 'cardsCount')
      .groupBy('tag.id')
      .orderBy('COUNT(DISTINCT cards.id)', 'DESC')
      .limit(10)
      .getMany();

    logger.log('베스트 태그 목록 반환이 완료되었습니다.');

    return tags;
  }

  async getTagListByKeyword(keyword: string): Promise<Tag[]> {
    logger.log(`===== tag.service.getTagListByKeyword =====`);
    logger.log(`입력된 태그 검색 키워드 : ${keyword}`);

    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.cards', 'cards')
      .select(['tag.id', 'tag.keyword'])
      .addSelect('COUNT(DISTINCT cards.id)', 'cardsCount')
      .where('tag.keyword ILIKE :keyword', { keyword: `%${keyword}%` })
      .groupBy('tag.id')
      .orderBy('COUNT(DISTINCT cards.id)', 'DESC')
      .limit(10)
      .getMany();

    logger.log('키워드에 맞는 태그 목록 반환이 완료되었습니다.');

    return tags;
  }

  async createTag(dto: CreateTagDto): Promise<Tag> {
    logger.log(`===== tag.service.createTag =====`);
    const isExists = await this.existsTag(dto.keyword);

    if (isExists) {
      logger.warn(`'${dto.keyword}' - 태그가 이미 존재합니다.`);
      return;
    }

    const tag = this.tagRepository.create({
      ...dto,
      cards: [],
    });

    await this.tagRepository.save(tag);

    logger.log(`${dto.keyword} - 태그가 생성되었습니다.`);

    return tag;
  }

  async existsTag(keyword: string): Promise<boolean> {
    logger.log(`===== tag.service.existsTag =====`);
    const isExists = await this.tagRepository.exists({
      where: { keyword },
    });

    logger.log(
      `${keyword} - 태그가 ${isExists ? '존재합니다' : '존재하지 않습니다'}.`,
    );

    return isExists;
  }

  async deleteTag(id: number): Promise<Tag> {
    logger.log(`===== tag.service.deleteTag =====`);
    const tag = await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.id = :id', { id })
      .leftJoinAndSelect('tag.cards', 'cards')
      .select(['tag.id', 'cards.id'])
      .getOne();

    if (tag.cards.length) {
      logger.warn(`${tag.id} - 태그를 사용하는 카드가 존재합니다.`);
      return;
    }

    await this.tagRepository.delete(tag);
    logger.log(`${tag.id} - 태그가 삭제되었습니다.`);

    return tag;
  }

  async clearTag(): Promise<DeleteResult[]> {
    logger.log(`===== tag.service.clearTag =====`);
    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.cards', 'cards')
      .select(['tag.id', 'cards.id'])
      .getMany();

    const deleteTags = await Promise.all(
      tags.map(async tag => {
        if (tag.cards.length) {
          logger.warn(`${tag.id} - 태그를 사용하는 카드가 존재합니다.`);
          return;
        }

        const deleteTag = await this.tagRepository.delete(tag);

        if (deleteTag) {
          return deleteTag;
        }

        return deleteTag;
      }),
    );

    return deleteTags;
  }
}
