import { Inject, Injectable, Scope } from "@nestjs/common";
import { CONFIG_OPTIONAL, CONFIG_OBJECT, SimpleConfigOptional } from ".";
import { flatten } from 'flat';
import * as _ from 'lodash';

@Injectable({scope: Scope.DEFAULT})
export class Configuration {

    constructor( 
        @Inject(CONFIG_OPTIONAL) private readonly optional: SimpleConfigOptional,
        @Inject(CONFIG_OBJECT) private readonly configObject: any) {

    }

    get<T = any>(key: string): T {

        const k = key.replace(this.optional.keyPathDelimiter as string, '.');

        return _.get(this.configObject, k) as T;
    }

    getEntries(): [key: string, value: any][] {
        return flatten(this.configObject, {delimiter: this.optional.keyPathDelimiter});
    }
}