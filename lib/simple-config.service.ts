import { Inject, Injectable, Scope } from "@nestjs/common";
import { CONFIG_OBJECT } from ".";
import { flatten } from 'flat';
import * as _ from 'lodash';

@Injectable({scope: Scope.DEFAULT})
export class Configuration {

    constructor( @Inject(CONFIG_OBJECT) private readonly configObject: any) {

    }

    get<T = any>(key: string): T {
        return _.get(this.configObject, key) as T;
    }

    getEntries(): [key: string, value: any][] {
        return flatten(this.configObject);
    }
}