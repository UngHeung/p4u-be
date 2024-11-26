import { IsString, Length } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { stringValidationMessage } from 'src/common/validation/message/type-validation.message';
import { User } from 'src/user/entity/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Reaction } from './reaction.entity';

@Entity({ name: 'thanks' })
export class Thanks extends BaseModel {
  @Column({ nullable: false })
  @Length(2, 100)
  @IsString({ message: stringValidationMessage })
  content: string;

  @ManyToOne(() => User, user => user.thanks)
  writer: User;

  @OneToMany(() => Reaction, reaction => reaction.thanks)
  reactions: Reaction[];

  @Column({ nullable: false, type: 'json' })
  reactionsCount: { [key: string]: number };
}
