
export type ArrayMergeMode = 'section' | 'all';

export interface ConfigurationBuilderOption {
    keyPathDelimiter?: string; // '.'
    arrayMergeMode?: ArrayMergeMode; // 'section

    validator?: ConfigValidatorOptions;
}

export interface SimpleConfigOptional extends ConfigurationBuilderOption {

    configFileOptions?: ConfigurationFileOptions;

    envOptions?: EnvironmentOptions;
}

export type FileType = 'json' | 'yaml';

export interface ConfigurationFileOptions {
    fileType?: FileType;
    rootPath?: string; // __dirname
    filename?: string; // appsettings.{}.json
    includeMiddleNames?: string[];
}

export interface EnvironmentOptions {
    prefix?: string; // NestApp
    delimiter?: string; // __

}

export interface ConfigValidatorOptions {
    validator: (config: any) => void ;
    checkLevel: 'warn' | 'error' | 'detail' ; // 'error'
}