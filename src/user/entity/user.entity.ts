import { Length, Matches } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'users',
  orderBy: {
    id: 'DESC',
    name: 'ASC',
  },
})
export class User extends BaseModel {
  @Column({ nullable: false })
  @Length(2, 12, { message: '이름은 2자 이상 12자 이하로 입력해주세요.' })
  @Matches(/[a-zA-Z가-힣]/g, {
    message: '이름은 한글, 영문 대소문자로만 입력해주세요.',
  })
  name: string;

  @Column({ nullable: false })
  @Length(6, 12, { message: '아이디는 6자 이상 12자 이하로 입력해주세요.' })
  @Matches(/[a-z0-9]/g, {
    message: '아이디는 영문 소문자, 숫자로만 입력해주세요.',
  })
  account: string;

  @Column({ nullable: false })
  @Length(8, 16, { message: '비밀번호는 8자 이상 16자 이하로 입력해주세요.' })
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%]).{8,}$/g, {
    message:
      '비밀번호는 영문 대소문자, 특수문자를 하나씩 포함하여 입력해주세요.',
  })
  password: string;
}
