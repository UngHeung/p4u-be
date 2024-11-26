import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateReactionDto } from './dto/createReactions.dto';
import { UpdateReactionDto } from './dto/updateReactions.dto';
import { Reaction } from './entity/reaction.entity';
import { ThanksService } from './thanks.service';

const logger = new Logger('ReactionsService');

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    private readonly thanksService: ThanksService,
    private readonly dataSource: DataSource,
  ) {}

  async createReaction(
    user: User,
    dto: CreateReactionDto,
    thanksId: number,
  ): Promise<Reaction> {
    logger.log('===== reactions.service.createReaction =====');

    const existingReaction = await this.reactionRepository.exists({
      where: {
        reactioner: { id: user.id },
        thanks: { id: thanksId },
      },
      relations: ['reactioner', 'thanks'],
    });

    if (existingReaction) {
      logger.warn('이미 반응을 남겼습니다.');
      throw new ConflictException('이미 반응을 남겼습니다.');
    }

    const reaction = this.reactionRepository.create({
      type: dto.type,
      reactioner: user,
      thanks: { id: thanksId },
    });

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const updateReactionsCount = await this.thanksService.updateReactionsCount(
      thanksId,
      dto.type,
      true,
    );

    if (!updateReactionsCount) {
      logger.log('감사글 반응 수 업데이트에 실패하였습니다.');
      await queryRunner.rollbackTransaction();
      throw new NotFoundException('감사글 반응 수 업데이트에 실패하였습니다.');
    }

    await this.reactionRepository.save(reaction);
    logger.log('반응이 생성되었습니다.');

    await queryRunner.commitTransaction();

    return reaction;
  }

  async getReactionsByThanksId(id: number): Promise<Reaction[]> {
    logger.log('===== thanks.service.getReactionsByThanksId =====');

    const reactions = await this.reactionRepository
      .createQueryBuilder('reaction')
      .leftJoin('reaction.thanks', 'thanks')
      .select(['reaction.id', 'reaction.type'])
      .where('thanks.id = :id', { id })
      .getMany();

    if (!reactions) {
      logger.log('반응이 존재하지 않습니다.');
      throw new NotFoundException('반응이 존재하지 않습니다.');
    }

    logger.log(`${id} - thanks의 반응 반환이 완료되었습니다.`);

    return reactions;
  }

  async findMyReaction(user: User, id: number): Promise<Reaction> {
    logger.log('===== thanks.service.findMyReaction =====');

    const reaction = await this.reactionRepository
      .createQueryBuilder('reaction')
      .leftJoin('reaction.reactioner', 'reactioner')
      .leftJoin('reaction.thanks', 'thanks')
      .select(['reaction.id', 'reaction.type', 'thanks.id', 'reactioner.id'])
      .where('reaction.id = :id', { id })
      .andWhere('reactioner.id = :userId', { userId: user.id })
      .getOne();

    if (!reaction) {
      logger.log('반응이 존재하지 않습니다.');
      throw new NotFoundException('반응이 존재하지 않습니다.');
    }

    logger.log(`${reaction.id} - 반응 반환이 완료되었습니다.`);
    return reaction;
  }
}
