import { Module, DynamicModule } from '@nestjs/common';
import { CONFIG_OPTIONAL, CONFIG_OBJECT,
        ConfigurationFileOptions, SimpleConfigOptional,
        Configuration,
        ConfigurationBuilder,
        ConfigurationBuilderOption,
        EnvConfigurationProvider,
        JsonConfigurationProvider,
        FileConfigurationProvider,
        YamlConfigurationProvider,
        definedProps,
        DefaultSimpleConfigOptions
} from '.';

import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
@Module({})
export class SimpleConfigModule {
    public static forRoot(options?: SimpleConfigOptional): DynamicModule {
        options = SimpleConfigModule.mergeDefaultOptional(options);
        return SimpleConfigModule.forRootWithConfigBuilder(SimpleConfigModule.createBuildActionFromOptions(options));
    }


    public static forRootWithConfigBuilder(buildAction?: (builder: ConfigurationBuilder) => void): DynamicModule {
        
        const defaultOptions =  new DefaultSimpleConfigOptions();
        const builder = new ConfigurationBuilder(defaultOptions as ConfigurationBuilderOption);
        
        buildAction =  buildAction  ?? ((b: ConfigurationBuilder)=> {
            b.add(new JsonConfigurationProvider(path.join(__dirname,'appsettings.json')));
            b.add(new JsonConfigurationProvider(path.join(__dirname,`appsettings.${process.env.NODE_ENV}.json`)));
            b.add(new EnvConfigurationProvider(defaultOptions.envOptions ));
        });


        buildAction(builder)
        const configObj = builder.build();
        return {
            module: SimpleConfigModule,
            global: true,
            providers: [
                {
                    provide: CONFIG_OPTIONAL,
                    useValue: builder.options,
                },
                {
                    provide: CONFIG_OBJECT,
                    useFactory: () => {
                        return configObj;
                    },
                },
                {
                    provide: Configuration,
                    useFactory: (optional: SimpleConfigOptional , config: any) => new Configuration(optional, config),
                    inject: [CONFIG_OPTIONAL, CONFIG_OBJECT]
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

        options = _.merge(defaultOptions, definedProps(options));

        return options as SimpleConfigOptional;
    }


    private static createBuildActionFromOptions(options?: SimpleConfigOptional): (builder: ConfigurationBuilder) => void {
        const _options = SimpleConfigModule.mergeDefaultOptional(options) as SimpleConfigOptional;


        const generateFileConfigProviders: (fileOptions: ConfigurationFileOptions)=> FileConfigurationProvider[] 
                = (fileOptions: ConfigurationFileOptions) => {

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

            const fileProviderFactory = (filename: fs.PathLike) => {
                switch(fileOptions.fileType) {
                    case 'json': return new JsonConfigurationProvider(filename);

                        break;
                    case 'yaml': return new YamlConfigurationProvider(filename);
                    default:
                        throw new Error(`type ${fileOptions.fileType} not supports`);
                }
            }



            return _.chain(allConfigFiles)
                    .filter( f => fs.existsSync(f))
                    .map(f => fileProviderFactory(f))
                    .value();
        };

        return (b: ConfigurationBuilder) => {
            b.options.arrayMergeMode = _options.arrayMergeMode;
            b.options.keyPathDelimiter = _options.keyPathDelimiter;

            b.addRange(... generateFileConfigProviders(_options.configFileOptions as ConfigurationFileOptions))
             .add(new EnvConfigurationProvider(_options.envOptions));
        };
    }

} 