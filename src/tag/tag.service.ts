import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      .createQueryBuilder()
      .where('keyword = :keyword', { keyword })
      .select(['tag.id', 'tag.keyword'])
      .getOne();

    if (!tag) {
      logger.warn(`${keyword} - 태그가 존재하지 않습니다.`);
      throw new NotFoundException('태그가 존재하지 않습니다.');
    }

    return tag;
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
      .where('id = :id', { id })
      .leftJoinAndSelect('tag.cards', 'cards')
      .select(['tag.id', 'cards.id'])
      .getOne();

    if (tag.cards.length) {
      logger.warn(`${tag.keyword} - 태그를 사용하는 카드가 존재합니다.`);
      return;
    }

    await this.tagRepository.delete(tag);
    logger.log(`${tag.keyword} - 태그가 삭제되었습니다.`);

    return tag;
  }
}
