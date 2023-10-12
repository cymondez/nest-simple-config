import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule } from '../../lib'
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

    static LoadInculdesJsonConfigFile(): DynamicModule{
        return {
            module: AppModule,
            imports: [SimpleConfigModule.forRoot({
                configFileOptions: {
                    filename: join(__dirname ,'settings' ,'appsettings.json'),
                    inculdeMiddleNames: ['override']
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
                    inculdeMiddleNames: ['override']
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
                        prifix: 'App',
                    }
                })
            ],
        }
    }

}
