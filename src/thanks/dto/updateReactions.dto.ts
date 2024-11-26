import { IsEnum } from 'class-validator';
import { ReactionType } from '../enum/reactionType.enum';

export class UpdateReactionDto {
  @IsEnum(ReactionType)
  type: ReactionType;
}
