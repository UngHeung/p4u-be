import { IsBoolean, IsString, Length } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { lengthValidationMessage } from 'src/common/validation/message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation/message/type-validation.message';
import { Tag } from 'src/tag/entity/tag.entity';
import { User } from 'src/user/entity/user.entity';
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';

@Entity({ name: 'cards' })
export class Card extends BaseModel {
  @Column({ nullable: false })
  @Length(2, 15, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  title: string;

  @Column({ nullable: false })
  @Length(2, 300, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  content: string;

  @Column({ nullable: false, default: false })
  @IsBoolean()
  isAnonymity: boolean;

  @ManyToOne(() => User, user => user.cards)
  writer: User;

  @ManyToMany(() => Tag, tag => tag.cards)
  @JoinColumn()
  tags: Tag[];

  @ManyToMany(() => User, user => user.pickCards, { onDelete: 'CASCADE' })
  @JoinColumn()
  pickers: User[];
}
