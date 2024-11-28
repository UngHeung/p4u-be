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
    logger.log('===== thanks.service.createReaction =====');

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const existingReaction = await this.reactionRepository.exists({
        where: {
          reactioner: { id: user.id },
          thanks: { id: thanksId },
        },
        relations: ['reactioner', 'thanks'],
      });

      if (existingReaction) {
        throw new ConflictException('이미 반응을 남겼습니다.');
      }

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const reaction = this.reactionRepository.create({
        type: dto.type,
        reactioner: user,
        thanks: { id: thanksId },
      });

      const updateReactionsCount =
        await this.thanksService.updateReactionsCount(thanksId, dto.type, true);

      if (!updateReactionsCount) {
        throw new NotFoundException(
          '감사글 반응 수 업데이트에 실패하였습니다.',
        );
      }

      logger.log('감사글 반응 수 업데이트가 완료되었습니다.');

      await this.reactionRepository.save(reaction);
      logger.log('반응이 생성되었습니다.');

      await queryRunner.commitTransaction();

      return reaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

  async updateReaction(
    user: User,
    dto: UpdateReactionDto,
    id: number,
  ): Promise<Reaction> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const updatedReaction = await this.reactionRepository
        .createQueryBuilder('reaction')
        .leftJoin('reaction.thanks', 'thanks')
        .leftJoin('reaction.reactioner', 'reactioner')
        .select(['reaction.id', 'reaction.type', 'thanks.id', 'reactioner.id'])
        .where('reaction.id = :id', { id })
        .andWhere('reactioner.id = :userId', { userId: user.id })
        .getOne();

      if (!updatedReaction) {
        throw new NotFoundException('반응이 존재하지 않습니다.');
      }

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const currentReactionsCount =
        await this.thanksService.changeReactionsCount(
          updatedReaction.thanks.id,
          updatedReaction.type,
          dto.type,
        );

      if (!currentReactionsCount) {
        throw new NotFoundException(
          '감사글 반응 수 업데이트에 실패하였습니다.',
        );
      }

      if (dto.type === updatedReaction.type) {
        await this.deleteReaction(user, id);

        logger.log('반응이 삭제되었습니다.');

        await queryRunner.commitTransaction();
        return updatedReaction;
      }

      updatedReaction.type = dto.type;
      await this.reactionRepository.save(updatedReaction);

      logger.log('반응이 업데이트되었습니다.');

      await queryRunner.commitTransaction();

      return updatedReaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteReaction(user: User, id: number): Promise<void> {
    logger.log('===== thanks.service.deleteReaction =====');

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const reaction = await this.findMyReaction(user, id);

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const updatedReactionsCount =
        await this.thanksService.updateReactionsCount(
          reaction.thanks.id,
          reaction.type,
          false,
        );

      if (!updatedReactionsCount) {
        throw new NotFoundException(
          '감사글 반응 수 업데이트에 실패하였습니다.',
        );
      }

      await this.reactionRepository.delete(reaction.id);

      logger.log('반응이 삭제되었습니다.');

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
