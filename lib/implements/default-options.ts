import { EnvironmentOptions, ConfigurationFileOptions, ConfigurationBuilderOption, ArrayMergeMode, FileType, SimpleConfigOptional } from "../interfaces";

export class DefaultEnvOptions implements EnvironmentOptions {
    prefix: string =  'NestApp';
    delimiter?: string = '__' ;
}

export class DefaultFileOptions implements ConfigurationFileOptions {
    fileType?: FileType = 'json';
    rootPath?: string = '.';
    filename?: string = 'appsettings.json'
    includeMiddleNames?: string[] = [];
}


export class DefaultConfigurationBuilderOption implements ConfigurationBuilderOption {
    keyPathDelimiter?: string = '.'
    arrayMergeMode?: ArrayMergeMode =  'section';
}

export class DefaultSimpleConfigOptions extends  DefaultConfigurationBuilderOption implements SimpleConfigOptional {
    configFileOptions = new DefaultFileOptions();
    envOptions = new DefaultEnvOptions();

}