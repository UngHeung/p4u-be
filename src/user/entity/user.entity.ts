import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Card } from 'src/card/entity/card.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { lengthValidationMessage } from 'src/common/validation/message/length-validation.message';
import {
  emailValidationMessage,
  stringValidationMessage,
} from 'src/common/validation/message/type-validation.message';
import { Reaction } from 'src/thanks/entity/reaction.entity';
import { Thanks } from 'src/thanks/entity/thanks.entity';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { UserRole } from '../enum/userRole.enum';

@Entity({
  name: 'users',
  orderBy: {
    id: 'DESC',
    name: 'ASC',
    account: 'ASC',
  },
})
export class User extends BaseModel {
  @Column({ nullable: false })
  @Length(2, 12, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @Matches(/[a-zA-Z가-힣]/g, {
    message: 'name은(는) 한글, 영문 대소문자로만 입력해주세요.',
  })
  name: string;

  @Column({ nullable: true, unique: true })
  @Length(2, 6, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  nickname: string;

  @Column({ nullable: false, default: false })
  @IsBoolean()
  isShowNickname: boolean;

  @Column({ nullable: false, unique: true })
  @Length(6, 12, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @Matches(/[a-z0-9]/g, {
    message: 'id은(는) 영문 소문자, 숫자로만 입력해주세요.',
  })
  account: string;

  @Column({ nullable: false })
  @Length(8, 16, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%]).{8,}$/g, {
    message:
      'password은(는) 영문 대소문자, 특수문자를 하나씩 포함하여 입력해주세요.',
  })
  password: string;

  @Column({ nullable: true, unique: true })
  @IsEmail({}, { message: emailValidationMessage })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/g, {
    message: emailValidationMessage,
  })
  email: string;

  @Column({ nullable: false, default: UserRole.USER })
  @IsEnum(UserRole)
  userRole: UserRole;

  @Column({ nullable: false, default: true })
  @IsBoolean()
  isActivate: boolean;

  @Column({ nullable: false, default: false })
  @IsBoolean()
  emailVerified: boolean;

  @OneToMany(() => Card, card => card.writer)
  cards: Card[];

  @ManyToMany(() => Card, card => card.pickers)
  pickCards: Card[];

  @ManyToMany(() => Card, card => card.reporters)
  reportCards: Card[];

  @OneToMany(() => Thanks, thanks => thanks.writer)
  thanks: Thanks[];

  @ManyToMany(() => Thanks, thanks => thanks.reports)
  reports: Thanks[];

  @OneToMany(() => Reaction, reaction => reaction.reactioner)
  reactions: Reaction[];
}
