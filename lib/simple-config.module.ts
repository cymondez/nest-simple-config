import { Module, DynamicModule } from '@nestjs/common';
import { CONFIG_OPTIONAL, CONFIG_OBJECT,
        ConfigurationFileOptions, SimpleConfigOptional,
        SecretConfigurationFileOptions,
        Configuration,
        ConfigurationBuilder,
        ConfigurationBuilderOption,
        EnvConfigurationProvider,
        JsonConfigurationProvider,
        FileConfigurationProvider,
        YamlConfigurationProvider,
        definedProps,
        DefaultSimpleConfigOptions,
        CommandlineConfigurationProvider,
        JsonSecretConfigurationProvider,
        YamlSecretConfigurationProvider,
        SecretConfigurationProvider,
        DefaultSecretFileOptions,
} from '.';

import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigOptionsModule } from './config-options.module';
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
            b.add(new JsonConfigurationProvider(path.join(__dirname,`appsettings.${process.env.NODE_ENV}.json`), true));
            b.add(new EnvConfigurationProvider(defaultOptions.envOptions ));
            b.add(new CommandlineConfigurationProvider());
        });


        buildAction(builder);
        const hasAsyncProviders = builder.hasAsyncProviders();
        const configObj = hasAsyncProviders ? undefined : builder.build();
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
                        return hasAsyncProviders ? builder.buildAsync() : configObj;
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
        const secretStore = options?.secretConfigFileOptions?.store;
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

        const mergedOptions = _.merge(defaultOptions, definedProps(options)) as SimpleConfigOptional;

        if (mergedOptions.secretConfigFileOptions) {
            mergedOptions.secretConfigFileOptions = _.merge(
                new DefaultSecretFileOptions(),
                mergedOptions.secretConfigFileOptions,
            );
            if (secretStore) {
                mergedOptions.secretConfigFileOptions.store = secretStore;
            }
        }

        return mergedOptions;
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

            b.addRange(... generateFileConfigProviders(_options.configFileOptions as ConfigurationFileOptions));
            if (_options.secretConfigFileOptions) {
                b.add(SimpleConfigModule.createSecretConfigurationProvider(_options.secretConfigFileOptions));
            }
            b.add(new EnvConfigurationProvider(_options.envOptions))
             .add(new CommandlineConfigurationProvider());
        };
    }

    private static createSecretConfigurationProvider(
        fileOptions: SecretConfigurationFileOptions,
    ): SecretConfigurationProvider {
        const filename = fileOptions.filename ?? 'appsettings.secrets.json';
        const parsedFilename = path.parse(filename);
        const rawExtension = parsedFilename.ext.toLowerCase();
        const supportedExtensions = ['.json', '.yaml', '.yml'];
        const hasSupportedExtension = supportedExtensions.includes(rawExtension);
        const extension = hasSupportedExtension ? rawExtension : '';
        const baseName = hasSupportedExtension ? parsedFilename.name : parsedFilename.base;
        const inferredFileType = extension === '.yaml' || extension === '.yml'
            ? 'yaml'
            : 'json';

        if (fileOptions.fileType && extension !== '' && fileOptions.fileType !== inferredFileType) {
            throw new Error(
                `Secret configuration file type ${fileOptions.fileType} does not match extension ${extension}.`,
            );
        }

        const fileType = fileOptions.fileType ?? inferredFileType;
        const finalExtension = extension || (fileType === 'yaml' ? '.yaml' : '.json');
        const rootPath = parsedFilename.dir || fileOptions.rootPath || '.';
        const fullFilename = path.join(rootPath, `${baseName}${finalExtension}`);
        const providerOptions = {
            service: fileOptions.service,
            optional: fileOptions.optional ?? true,
            store: fileOptions.store,
        };

        return fileType === 'yaml'
            ? new YamlSecretConfigurationProvider(fullFilename, providerOptions)
            : new JsonSecretConfigurationProvider(fullFilename, providerOptions);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public static registerOptions(optionTypes: Function[]): DynamicModule {
        const configOptionsModule = ConfigOptionsModule.register(optionTypes);
        return {
            module: SimpleConfigModule,
            imports: [configOptionsModule],
            providers: configOptionsModule.providers,
            exports: configOptionsModule.exports,
        };
    }
} 
