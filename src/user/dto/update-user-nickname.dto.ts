import { IsBoolean, IsString, Length } from 'class-validator';
import { lengthValidationMessage } from 'src/common/validation/message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation/message/type-validation.message';
import { User } from '../entity/user.entity';

export class UpdateUserNicknameDto implements Partial<User> {
  @Length(2, 6, { message: lengthValidationMessage })
  @IsString({ message: stringValidationMessage })
  nickname: string;

  @IsBoolean()
  isShowNickname: boolean;
}
