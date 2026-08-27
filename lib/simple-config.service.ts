import { Inject, Injectable, Scope } from "@nestjs/common";
import { CONFIG_OPTIONAL, CONFIG_OBJECT, ConfigurationBuilderOption } from ".";
import { flatten } from 'flat';
import * as _ from 'lodash';

@Injectable({scope: Scope.DEFAULT})
export class Configuration {

    private readonly immutableConfig: any;

    constructor( 
        @Inject(CONFIG_OPTIONAL) private readonly optional: ConfigurationBuilderOption,
        @Inject(CONFIG_OBJECT) private readonly configObject: any) {
        
        // 一次性處理：複製並凍結
        this.immutableConfig = this.makeImmutable(this.configObject);
    }

    private makeImmutable(obj: any): any {
        // 使用 structuredClone (Node.js 17+) 或 lodash cloneDeep
        const cloned = typeof structuredClone !== 'undefined' 
            ? structuredClone(obj) 
            : _.cloneDeep(obj);
            
        return this.deepFreeze(cloned);
    }

    private deepFreeze(obj: any): any {
        if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(value => this.deepFreeze(value));
            Object.freeze(obj);
        }
        return obj;
    }


    // get<T = any>(key: string): T {

    //     const k = key.replace(this.optional.keyPathDelimiter as string, '.');

    //     const section = _.get(this.configObject, k) ;

    //     return _.cloneDeep(section) as T;
    // }

    get<T = any>(key: string): T {
        const k = key.replace(this.optional.keyPathDelimiter as string, '.');
        const section = _.get(this.immutableConfig, k);
        
        // 直接返回，因為已經是不可變的
        return section as T;
    }
    getEntries(): [key: string, value: any][] {
        return flatten(this.configObject, {delimiter: this.optional.keyPathDelimiter});
    }
}