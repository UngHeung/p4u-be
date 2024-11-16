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
    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.cards', 'cards')
      .select(['tag.id', 'tag.keyword'])
      .addSelect('COUNT(DISTINCT cards.id)', 'cardsCount')
      .groupBy('tag.id')
      .orderBy('COUNT(DISTINCT cards.id)', 'DESC')
      .limit(10)
      .getMany();

    return tags;
  }

  async getTagListByKeyword(keyword: string): Promise<Tag[]> {
    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .select(['tag.id', 'tag.keyword'])
      .where('tag.keyword ILIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('tag.id', 'DESC')
      .getMany();

    return tags;
  }

  async createTag(dto: CreateTagDto): Promise<Tag> {
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
    const isExists = await this.tagRepository.exists({
      where: { keyword },
    });

    logger.log(
      `${keyword} - 태그가 ${isExists ? '존재합니다' : '존재하지 않습니다'}.`,
    );

    return isExists;
  }

  async deleteTag(id: number): Promise<Tag> {
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
    const tags = await this.tagRepository.find({ select: ['id'] });

    const deleteTags = await Promise.all(
      tags.map(async tag => {
        const deleteTag = await this.tagRepository.delete(tag);

        if (deleteTag) {
          return deleteTag;
        }
      }),
    );

    return deleteTags;
  }
}
