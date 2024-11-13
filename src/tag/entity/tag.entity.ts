import { IsString, Length, Matches } from 'class-validator';
import { Card } from 'src/card/entity/card.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { lengthValidationMessage } from 'src/common/validation/message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation/message/type-validation.message';
import { Column, Entity, JoinColumn, ManyToMany } from 'typeorm';

@Entity({ name: 'tags' })
export class Tag extends BaseModel {
  @Column({ nullable: false })
  @Length(2, 8, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @Matches(/[a-zA-Z가-힣]/g)
  keyword: string;

  @ManyToMany(() => Card, card => card.tags)
  @JoinColumn()
  card: Card[];
}
