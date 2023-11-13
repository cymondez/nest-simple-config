
import { DefaultEnvOptions, definedProps } from "..";
import { EnvironmentOptions } from "../interfaces";
import { ConfigurationProvider } from "./config-provider.abstract";
import { unflatten } from 'flat';
import * as _ from 'lodash';
export class EnvConfigurationProvider extends ConfigurationProvider {

    constructor (public readonly options: EnvironmentOptions | undefined){
        super();
    }

    override loadConfigObject() {


        const _options =  _.merge(new DefaultEnvOptions(), definedProps(this.options)) as EnvironmentOptions;

        const noneEmptyEnv: any = Object.fromEntries(
            Object.entries(process.env)
                    .filter(([, value]) => !_.isEmpty(value))
                    .map(([key, value]) => {
                    let val: any = undefined;
                    try {
                        if (value){
                            val = JSON.parse(value);
                        }
                    }
                    catch {
                        //
                    }

                    return [key, val? val : value];
                    })
        );
        const inner = unflatten(noneEmptyEnv, {
            overwrite: true,
            transformKey: (key) => {
                const reg = new RegExp(`${_options.delimiter}`, "g");
                return key.replace(reg, ".");
            },
        }) as { [k: string]: string };
    

        const envConf_all = unflatten(inner, { overwrite: true }) as { [k: string]: any} ;
    
        const envConf = envConf_all[_options.prefix as string];
        
        return envConf;

    }
}