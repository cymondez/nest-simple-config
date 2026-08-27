import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, EnvConfigurationProvider, JsonConfigurationProvider, SimpleConfigModule } from '../../lib'
import { join } from 'path';
import { DatabaseOptions } from './typed-optionals/database-options';
import { ServerOptions } from './typed-optionals/server-options';
import { ConfigTestService } from './typed-optionals/config-test.service';
@Module({
})
export class AppModule { 

    constructor(private readonly config: Configuration) {

    }

    static LoadJsonConfigFile(): DynamicModule{
        return {
            module: AppModule,
            imports: [SimpleConfigModule.forRoot({configFileOptions: {filename: join(__dirname,'appsettings.json')}})]
        }
    }

    static LoadJsonConfigFileWithNodeEnv(): DynamicModule{
        return {
            module: AppModule,
            imports: [SimpleConfigModule.forRoot({configFileOptions: {filename: join(__dirname ,'settings' ,'appsettings.json')}})]
        }
    }

    static LoadIncludesJsonConfigFile(): DynamicModule{
        return {
            module: AppModule,
            imports: [SimpleConfigModule.forRoot({
                configFileOptions: {
                    filename: join(__dirname ,'settings' ,'appsettings.json'),
                    includeMiddleNames: ['override']
                }
            })]
        }
    }

    static ArrayAllOverride(): DynamicModule{
        return {
            module: AppModule,
            imports: [SimpleConfigModule.forRoot({
                arrayMergeMode: 'all',
                configFileOptions: {
                    filename: join(__dirname ,'settings' ,'appsettings.json'),
                    includeMiddleNames: ['override']
                }
            })]
        }
    }

    static LoadWithEnvVarOverride(): DynamicModule {
        return {
            module: AppModule,
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(__dirname ,'settings' ,'appsettings.json'),
                    },
                    envOptions: {
                        prefix: 'App',
                    }
                })
            ],
        }
    }

    static ChangeKeyPathDelimiter(): DynamicModule{
        return {
            module: AppModule,
            imports: [SimpleConfigModule.forRoot({
                keyPathDelimiter: '::',
                configFileOptions: {filename: join(__dirname,'appsettings.json')}
            })]
        }
    }

    static UsingConfigurationBuilder(): DynamicModule {
        return {
            module: AppModule,
            imports: [SimpleConfigModule.forRootWithConfigBuilder((builder) => {

                // The later you add, the higher the priority.
                // And you can implement custom ConfigurationProviders by yourself
                builder.add(new JsonConfigurationProvider(join(__dirname, 'settings', 'appsettings.json')))
                       .add(new JsonConfigurationProvider(join(__dirname, 'settings', `appsettings.${process.env.NODE_ENV}.json`), true))
                       .add(new EnvConfigurationProvider({prefix: 'App'}));
            })]
        }
    }

    static testFileConfigurationProviderOptional(): DynamicModule {
        return {
            module: AppModule,
            imports: [SimpleConfigModule.forRootWithConfigBuilder((builder) => {

                // The later you add, the higher the priority.
                // And you can implement custom ConfigurationProviders by yourself
                builder.add(new JsonConfigurationProvider(join(__dirname, 'appsettings.json')))
                       .add(new JsonConfigurationProvider(join(__dirname, `appsettings.${process.env.NODE_ENV}.json`), true))
                       .add(new EnvConfigurationProvider({prefix: 'App'}));
            })]
        }
    }

    // Typed Optional Configuration Tests
    static withValidTypedConfig(): DynamicModule {
        return {
            module: AppModule,
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(__dirname, 'settings', 'appsettings.valid.json')
                    }
                }),
                SimpleConfigModule.registerOptions([DatabaseOptions, ServerOptions])
            ],
            providers: [ConfigTestService],
            exports: [ConfigTestService]
        };
    }

    static withInvalidTypedConfig(): DynamicModule {
        return {
            module: AppModule,
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(__dirname, 'settings', 'appsettings.invalid.json')
                    }
                }),
                SimpleConfigModule.registerOptions([DatabaseOptions, ServerOptions])
            ],
            providers: [ConfigTestService],
            exports: [ConfigTestService]
        };
    }

}
