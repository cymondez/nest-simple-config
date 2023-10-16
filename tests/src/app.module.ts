import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, DefaultEnvOptions, EnvConfigurationProvider, JsonConfigurationProvider, SimpleConfigModule } from '../../lib'
import { join } from 'path';
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

                builder.add(new JsonConfigurationProvider(join(__dirname, 'settings', 'appsettings.json')))
                       .add(new JsonConfigurationProvider(join(__dirname, 'settings', `appsettings.${process.env.NODE_ENV}.json`)))
                       .add(new EnvConfigurationProvider({prefix: 'App'}));
            })]
        }
    }

}
