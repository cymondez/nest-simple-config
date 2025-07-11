<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[travis-image]: https://api.travis-ci.org/nestjs/nest.svg?branch=master
[travis-url]: https://travis-ci.org/nestjs/nest
[linux-image]: https://img.shields.io/travis/nestjs/nest/master.svg?label=linux
[linux-url]: https://travis-ci.org/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/dm/@nestjs/core.svg" alt="NPM Downloads" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#5" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec"><img src="https://img.shields.io/badge/Donate-PayPal-dc3d53.svg"/></a>
  <a href="https://twitter.com/nestframework"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

a simple config module for [Nest](https://github.com/nestjs/nest).

This configuration module can use JSON or YAML files as default settings and allow overriding these defaults at runtime using environment variables (similar to ASP.NET Core's Configuration).

## Installation

```bash
 npm i --save @mediaedge4tw/nest-simple-config
```

## Quick Start

### default configuration from file 
appsettings.json

```json
{
    "a": "base",
    "b": {
        "c": 123
    }
}
```


import in AppModule

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule } from '@mediaedge4tw/nest-simple-config'
import { join } from 'path';
@Module({
  imports: [
    SimpleConfigModule.forRoot({
      configFileOptions: {
            filename: join(__dirname,'appsettings.json'),
        }
    })
  ],
})
export class AppModule {}
```


inject Configuration in other injectable class

```ts

@Injectable()
export class OtherService {
  constructor(private readonly config: Configuration) {}

  getA() {
    return this.config.get('a'); // got a string: 'base'
  }

  getC() {
    return this.config.get('b.c'); // got a number: 123
  }

  getSection() {
    return this.config.get('b'); // got a object: { c : 123}
  }
}

```
### environment variables' runtime override (for Docker)

set environment variables

```sh
# prefix is NestApp, and object path delimiter is '__'
export NestApp__a='env'
export NestApp__b__c=789

```

import in AppModule, and set envConfig

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule } from '@mediaedge4tw/nest-simple-config'
import { join } from 'path';
@Module({
  imports: [
    SimpleConfigModule.forRoot({
      configFileOptions: {
            filename: join(__dirname,'appsettings.json'),
      },
      envOptions: {
          prefix: 'NestApp', // this is default value
      },
    })
  ],
})
export class AppModule {}
```

got override value

```ts

@Injectable()
export class OtherService {
  constructor(private readonly config: Configuration) {}

  getA() {
    return this.config.get('a'); // got a string: 'env'
  }

  getC() {
    return this.config.get('b.c'); // got a number: 789
  }
}
```


### array override mode


appsettings.json

```json
{
  "ary": [ 1, 2, 3 ]
}
```

appsettings.override.json
```json
{
  "ary": [ 11, 22 ]
}
```

import in AppModule, and set envConfig

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule } from '@mediaedge4tw/nest-simple-config'
import { join } from 'path';
@Module({
  imports: [
    SimpleConfigModule.forRoot({
      arrayMergeMode: 'all', // 'section' or 'all'
      configFileOptions: {
            filename: join(__dirname,'appsettings.json'),
      },
      envOptions: {
          prefix: 'NestApp', // this is default value
      },
    })
  ],
})
export class AppModule {}
```

got override array

```ts

@Injectable()
export class OtherService {
  constructor(private readonly config: Configuration) {

  }
  
  // if select 'section', ary is [11, 22, 3]
  // if select 'all', ary is [11, 22]
  getAry() {
    return this.config.get('ary'); 
  }
}

```
### using ConfigurationBuilder

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule, DefaultEnvOptions
        ,JsonConfigurationProvider, EnvConfigurationProvider } from '@mediaedge4tw/nest-simple-config'
import { join } from 'path';
@Module({
  imports: [SimpleConfigModule.forRootWithConfigBuilder((builder) => {

      builder.add(new JsonConfigurationProvider(join(__dirname, 'settings', 'appsettings.json')))
              .add(new JsonConfigurationProvider(join(__dirname, 'settings', `appsettings.${process.env.NODE_ENV}.json`), true))
              .add(new EnvConfigurationProvider({prefix: 'App'}));
  })],
})
export class AppModule {}
```

### Typed Configuration Options

For better type safety and validation, you can use typed configuration options with class-validator decorators.

#### Define Configuration Classes

First, create configuration classes with validation decorators:

```ts
// database-options.ts
import { IsString, IsInt, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BindOption } from '@mediaedge4tw/nest-simple-config';

export class ConnectionPoolOptions {
    @IsInt()
    @Min(1)
    @Max(100)
    min!: number;

    @IsInt()
    @Min(1)
    @Max(500)
    max!: number;

    @IsOptional()
    @IsInt()
    @Min(1000)
    timeout?: number;
}

@BindOption('database')
export class DatabaseOptions {
    @IsString()
    host!: string;

    @IsInt()
    @Min(1)
    @Max(65535)
    port!: number;

    @IsString()
    username!: string;

    @IsString()
    password!: string;

    @IsString()
    database!: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ConnectionPoolOptions)
    pool?: ConnectionPoolOptions;
}
```

```ts
// server-options.ts
import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { BindOption } from '@mediaedge4tw/nest-simple-config';

@BindOption('server')
export class ServerOptions {
    @IsString()
    host!: string;

    @IsInt()
    @Min(1)
    port!: number;

    @IsOptional()
    @IsBoolean()
    ssl?: boolean;

    @IsOptional()
    @IsString()
    environment?: string;
}
```

#### Configuration File

Create your configuration file with the corresponding structure:

```json
// appsettings.json
{
    "database": {
        "host": "localhost",
        "port": 5432,
        "username": "admin",
        "password": "secret123",
        "database": "myapp",
        "pool": {
            "min": 5,
            "max": 20,
            "timeout": 30000
        }
    },
    "server": {
        "host": "0.0.0.0",
        "port": 3000,
        "ssl": true,
        "environment": "production"
    }
}
```

#### Register Options in Module

Register your typed configuration options in your module:

```ts
import { Module } from '@nestjs/common';
import { SimpleConfigModule } from '@mediaedge4tw/nest-simple-config';
import { DatabaseOptions } from './config/database-options';
import { ServerOptions } from './config/server-options';
import { join } from 'path';

@Module({
  imports: [
    SimpleConfigModule.forRoot({
      configFileOptions: {
        filename: join(__dirname, 'appsettings.json')
      }
    }),
    SimpleConfigModule.registerOptions([DatabaseOptions, ServerOptions])
  ],
})
export class AppModule {}
```

#### Inject Typed Configuration

Use the `@InjectConfig` decorator to inject strongly-typed configuration:

```ts
import { Injectable } from '@nestjs/common';
import { InjectConfig, Options } from '@mediaedge4tw/nest-simple-config';
import { DatabaseOptions } from './config/database-options';
import { ServerOptions } from './config/server-options';

@Injectable()
export class MyService {
    constructor(
        @InjectConfig(DatabaseOptions) private readonly dbConfig: Options<DatabaseOptions>,
        @InjectConfig(ServerOptions) private readonly serverConfig: Options<ServerOptions>
    ) {}

    getDatabaseConnectionString(): string {
        const db = this.dbConfig.value;
        return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
    }

    getServerUrl(): string {
        const server = this.serverConfig.value;
        const protocol = server.ssl ? 'https' : 'http';
        return `${protocol}://${server.host}:${server.port}`;
    }

    getDatabaseConfig(): DatabaseOptions {
        return this.dbConfig.value; // Fully typed and validated
    }
}
```

#### Benefits

- **Type Safety**: Full TypeScript support with compile-time type checking
- **Validation**: Automatic validation using class-validator decorators
- **Auto-completion**: IDE support for configuration properties
- **Runtime Errors**: Clear error messages for invalid configurations
- **Nested Objects**: Support for complex nested configuration structures

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

[MIT licensed](LICENSE).
