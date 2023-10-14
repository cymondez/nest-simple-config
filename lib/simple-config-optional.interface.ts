
export type ArrayMergeMode = 'section' | 'all';
export interface SimpleConfigOptional {

    keyPathDelimiter?: string; // '.'

    arrayMergeMode?: ArrayMergeMode; // 'section

    configFileOptions?: ConfigurationFileOptions;

    envOptions?: EnvironmentOptions;
}

export type FileType = 'json'|'yaml';

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