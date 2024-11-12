import { ValidationArguments } from 'class-validator';

export const lengthValidationMessage = (args: ValidationArguments) => {
  const { property, constraints } = args;
  const message = `${property}은(는) ${constraints[0]}자 이상 ${constraints[1]}로 입력해주세요.`;

  return message;
};
