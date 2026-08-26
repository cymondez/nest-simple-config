
import type { SecretStore } from '../secret-store';

export type ArrayMergeMode = 'section' | 'all';

export interface ConfigurationBuilderOption {
    keyPathDelimiter?: string; // '.'
    arrayMergeMode?: ArrayMergeMode; // 'section

    validator?: ConfigValidatorOptions;
}

export interface SimpleConfigOptional extends ConfigurationBuilderOption {

    configFileOptions?: ConfigurationFileOptions;

    secretConfigFileOptions?: SecretConfigurationFileOptions;

    envOptions?: EnvironmentOptions;
}

export type FileType = 'json' | 'yaml';

export interface ConfigurationFileOptions {
    fileType?: FileType;
    rootPath?: string; // __dirname
    filename?: string; // appsettings.{}.json
    includeMiddleNames?: string[];
}

export interface SecretConfigurationFileOptions extends SecretConfigurationProviderOptions {
    fileType?: FileType;
    rootPath?: string;
    filename?: string;
}

export interface SecretConfigurationProviderOptions {
    service?: string;
    optional?: boolean;
    store?: SecretStore;
}

export interface EnvironmentOptions {
    prefix?: string; // NestApp
    delimiter?: string; // __

}

export interface ConfigValidatorOptions {
    validator: (config: any) => void ;
    checkLevel: 'warn' | 'error' | 'detail' ; // 'error'
}
