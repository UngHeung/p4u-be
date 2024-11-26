import { BaseModel } from 'src/common/entity/base.entity';
import { User } from 'src/user/entity/user.entity';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { ReactionType } from '../enum/reactionType.enum';
import { Thanks } from './thanks.entity';

@Entity({ name: 'reactions' })
@Unique(['reactioner', 'thanks'])
export class Reaction extends BaseModel {
  @Column({
    type: 'enum',
    enum: ReactionType,
    default: ReactionType.THUMBS_UP,
    nullable: false,
  })
  type: ReactionType;

  @ManyToOne(() => User, user => user.reactions)
  reactioner: User;

  @ManyToOne(() => Thanks, thanks => thanks.reactions, {
    onDelete: 'CASCADE',
  })
  thanks: Thanks;
}
