import { Inject, Injectable, Scope } from "@nestjs/common";
import { CONFIG_OPTIONAL, CONFIG_OBJECT, ConfigurationBuilderOption } from ".";
import { flatten } from 'flat';
import * as _ from 'lodash';

@Injectable({scope: Scope.DEFAULT})
export class Configuration {

    constructor( 
        @Inject(CONFIG_OPTIONAL) private readonly optional: ConfigurationBuilderOption,
        @Inject(CONFIG_OBJECT) private readonly configObject: any) {

    }

    get<T = any>(key: string): T {

        const k = key.replace(this.optional.keyPathDelimiter as string, '.');

        const section = _.get(this.configObject, k) ;

        return _.cloneDeep(section) as T;
    }

    getEntries(): [key: string, value: any][] {
        return flatten(this.configObject, {delimiter: this.optional.keyPathDelimiter});
    }
}