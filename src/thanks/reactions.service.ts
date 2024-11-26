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
}
