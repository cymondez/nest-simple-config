/* eslint-disable @typescript-eslint/ban-types */
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DynamicModule, Module, Provider } from '@nestjs/common';

import { Configuration } from '.';
import { getBindOptionToken } from './utils/bind-option-token';
import { BIND_OPTION_METADATA } from './decorators/bind-option.decorator';
import { Options } from './types/options';

@Module({})
export class ConfigOptionsModule {
  static register(optionTypes: Function[]): DynamicModule {
    const providers: Provider[] = optionTypes.map((type) => {
      const section = Reflect.getMetadata(BIND_OPTION_METADATA, type);
      if (!section) throw new Error(`Missing @BindOption for ${type.name}`);

      return {
        provide: getBindOptionToken(type),
        useFactory: (config: Configuration) => {
          const raw = config.get(section);
          const instance = plainToInstance(type as any, raw, { enableImplicitConversion: true });
          const errors = validateSync(instance, { whitelist: true });

          if (errors.length > 0) {
            throw new Error(`Invalid config for ${type.name}: ${JSON.stringify(errors)}`);
          }

          return new Options(instance);
        },
        inject: [Configuration],
      };
    });

    return {
      module: ConfigOptionsModule,
      providers,
      exports: providers,
    };
  }
}
