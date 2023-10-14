import { Module, DynamicModule } from '@nestjs/common';
import { COFIG_OPTIONAL, CONFIG_OBJECT, Configuration, ConfigurationFileOptions, EnvironmentOptions, SimpleConfigOptional} from '.';

import * as _ from 'lodash';
import { unflatten } from 'flat';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
@Module({})
export class SimpleConfigModule {
    public static forRoot(options?: SimpleConfigOptional): DynamicModule {
        
        options = SimpleConfigModule.mergeDefaultOptional(options);
        const customMerge = (obj: any, src: any ) => {
            switch(options!.arrayMergeMode) {
                case 'section':
                    return _.merge(obj,src);
                case 'all':
                    return _.mergeWith(obj, src, (objValue, srcValue)=> _.isArray(srcValue) ? srcValue : undefined);
                default:
                    throw new Error(`merge mode ${options!.arrayMergeMode} not supports .`);
            }
        };

        const generateFileConfigObject = (fileOptions: ConfigurationFileOptions) => {

            const baseFile= path.parse(fileOptions.filename as string);

            const baseFilename = baseFile.name;
            const ext = baseFile.ext !== '' ? baseFile.ext : `.${fileOptions.fileType}`;
            const root = baseFile.dir !== '' ? baseFile.dir : fileOptions.rootPath as string;
    
            const includeMiddleNames = fileOptions.includeMiddleNames ?? [];
    
            const allConfigFiles = [undefined, process.env.NODE_ENV, ... includeMiddleNames]
                                .map( m => {
                                    const filename = m ? [baseFilename, m].join('.') : baseFilename;
                                    const fullFilName = path.join(root, `${filename}${ext}`);
                                    return fullFilName;
                                } );
    
            let loadFunc: (filename: string) => any ;
    
            switch(fileOptions.fileType) {
                case 'json':
                    loadFunc = (filename) => {
                        return JSON.parse(fs.readFileSync(filename, "utf8"))
                    };
                    break;
                case 'yaml':
                    loadFunc = (filename) => {
                        return yaml.load(
                            fs.readFileSync(filename, 'utf8'),
                          );
                    };
                    break;
                default:
                    throw new Error(`type ${fileOptions.fileType} not supports`);
            }
            return        _.chain(allConfigFiles)
                          .filter( f => fs.existsSync(f))
                          .map(f => loadFunc(f))
                        //   .defaultTo([{}])
                          .reduce((p, c) => {
                            return p? customMerge(p, c) : c ;
                          })
                          .value();
            
        };

        const generateEnvConfigObject = (envOptions: EnvironmentOptions) => {

            const noneEmptyEnv: any = Object.fromEntries(
                Object.entries(process.env)
                      .filter(([, value]) => !_.isEmpty(value))
                      .map(([key, value]) => {
                        let val: any = undefined;
                        try {
                            if (value){
                                val = JSON.parse(value);
                            }
                        }
                        catch {
                            //
                        }
    
                        return [key, val? val : value];
                      })
            );
            const inner = unflatten(noneEmptyEnv, {
                overwrite: true,
                transformKey: (key) => {
                    const reg = new RegExp(`${envOptions.delimiter}`, "g");
                    return key.replace(reg, ".");
                },
            }) as { [k: string]: string };
        
            const envConf_all = unflatten(inner, { overwrite: true }) as { [k: string]: any} ;
        
            const envConf = envConf_all[envOptions.prefix as string];
            
            return envConf;
        }
    

        return {
            module: SimpleConfigModule,
            global: true,
            providers: [
                {
                    provide: COFIG_OPTIONAL,
                    useValue: options,
                },
                {
                    provide: CONFIG_OBJECT,
                    useFactory: () => {

                        const fileConfig = generateFileConfigObject(options!.configFileOptions as ConfigurationFileOptions);

                        const envConfig = generateEnvConfigObject(options!.envOptions as EnvironmentOptions);
                
                        const configObject = _.defaultTo( customMerge(fileConfig, envConfig), {});
                        return configObject;
                    },
                },
                {
                    provide: Configuration,
                    useFactory: (optional: SimpleConfigOptional , config: any) => new Configuration(optional, config),
                    inject: [COFIG_OPTIONAL, CONFIG_OBJECT]
                },
            ],
            exports: [Configuration],
        };
    }


    private static mergeDefaultOptional(options?: SimpleConfigOptional): SimpleConfigOptional {
        const defaultOptions: SimpleConfigOptional = {
            keyPathDelimiter: '.',
            arrayMergeMode: 'section',
            configFileOptions: {
                fileType: 'json',
                filename: 'appsettings',
                rootPath: '.',
                includeMiddleNames: [],
            },
            envOptions: {
                prefix: 'NestApp',
                delimiter: '__'
            },
        } ;

        options = _.merge(defaultOptions, SimpleConfigModule.definedProps(options));

        return options as SimpleConfigOptional;
    }

    private static definedProps(obj: any) {
        return Object.fromEntries(
            Object.entries(obj)
                .map(([k, v]) => [k, v ? v : undefined]) // 將null轉成undefined
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .filter(([k, v]) => v !== undefined),
        );
    }

} 