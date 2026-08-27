import { Inject } from '@nestjs/common';
import { getBindOptionToken } from '../utils/bind-option-token';

// eslint-disable-next-line @typescript-eslint/ban-types
export function InjectConfig(optionType: Function): ParameterDecorator {
  return Inject(getBindOptionToken(optionType));
}