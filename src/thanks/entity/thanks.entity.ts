import { IsString, Length } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { stringValidationMessage } from 'src/common/validation/message/type-validation.message';
import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Reaction } from './reaction.entity';

@Entity({ name: 'thanks' })
export class Thanks extends BaseModel {
  @Column({ nullable: false })
  @Length(2, 100)
  @IsString({ message: stringValidationMessage })
  content: string;

  @ManyToOne(() => User, user => user.thanks)
  writer: User;

  @Column({ nullable: false, default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToMany(() => User, user => user.reports, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'user_report_thanks' })
  reports: User[];

  @OneToMany(() => Reaction, reaction => reaction.thanks)
  reactions: Reaction[];

  @Column({
    nullable: false,
    type: 'json',
    default: '{ "heart": 0, "thumbsup": 0, "clap": 0, "smile": 0, "party": 0 }',
  })
  reactionsCount: { [key: string]: number };
}
