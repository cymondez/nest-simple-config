import { ConfigurationProvider } from "./config-providers";
import { ConfigurationBuilderOption } from ".";
import * as _ from 'lodash';
export class ConfigurationBuilder {

    providers: ConfigurationProvider[] = [];
    constructor( public readonly options: ConfigurationBuilderOption ) {}

    public add (provider: ConfigurationProvider): ConfigurationBuilder {

        this.providers.push(provider);
        return this;
    }

    public addRange(...provider: ConfigurationProvider[]): ConfigurationBuilder {
        for(const p of provider) {
            this.providers.push(p);
        }

        return this;
    }


    public build(): any {
        const customMerge = (obj: any, src: any ) => {
            switch(this.options!.arrayMergeMode) {
                case 'section':
                    return _.merge(obj,src);
                case 'all':
                    return _.mergeWith(obj, src, (objValue, srcValue)=> _.isArray(srcValue) ? srcValue : undefined);
                default:
                    throw new Error(`merge mode ${this.options!.arrayMergeMode} not supports .`);
            }
        };

        return   _.chain(this.providers)
                .map(p => p.loadConfigObject())
                .reduce((p, c) => {
                    return p? customMerge(p, c) : c ;
                })
                .value();
    }
}