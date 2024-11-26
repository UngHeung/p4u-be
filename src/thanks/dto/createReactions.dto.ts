import { IsEnum } from 'class-validator';
import { ReactionType } from '../enum/reactionType.enum';

export class CreateReactionDto {
  @IsEnum(ReactionType)
  type: ReactionType;
}
