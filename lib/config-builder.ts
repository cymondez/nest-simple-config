import { ConfigurationProvider } from "./config-providers";
import { ConfigurationBuilderOption } from ".";
import * as _ from 'lodash';
import { ConfigValidateException } from "./exceptions/config-validate-exception";
export class ConfigurationBuilder {

    providers: ConfigurationProvider[] = [];
    constructor(public readonly options: ConfigurationBuilderOption) { }

    public add(provider: ConfigurationProvider): ConfigurationBuilder {

        this.providers.push(provider);
        return this;
    }

    public addRange(...provider: ConfigurationProvider[]): ConfigurationBuilder {
        for (const p of provider) {
            this.providers.push(p);
        }

        return this;
    }


    public build(): any {
        const customMerge = (obj: any, src: any) => {
            switch (this.options!.arrayMergeMode) {
                case 'section':
                    return _.merge(obj, src);
                case 'all':
                    return _.mergeWith(obj, src, (objValue, srcValue) => _.isArray(srcValue) ? srcValue : undefined);
                default:
                    throw new Error(`merge mode ${this.options!.arrayMergeMode} not supports .`);
            }
        };

        const configObjWithMsgs = _.chain(this.providers)
            .map(p => p.loadConfigObject())
            .map(co => {
                const providerMsgAry: Array<{ provider: string, message: string }> = [];

                if (this.options!.validator) {

                    const validatorFunc = this.options!.validator.validator;

                    let exception = undefined;

                    try {
                        validatorFunc(co);
                    } catch (e) {
                        exception = e;
                    }


                    switch (this.options!.validator.checkLevel) {
                        case 'warn':
                            if (exception) {
                                console.warn(co.toString() + exception.message);
                            }
                            break;
                        case 'error':
                            if (exception) {
                                throw new ConfigValidateException(exception.message, [co.toString()]);
                            }
                            break;
                        case 'detail':
                            break;
                        default:
                            throw new Error(`check level ${this.options!.validator.checkLevel} not supports .`);
                    }
                }

                return {
                    configObj: co,
                    providerMsgAry,
                };
            })
            .reduce((p, c): { configObj: any; providerMsgAry: { provider: string; message: string; }[]; } => {
                const co = p.configObj ? customMerge(p.configObj, c.configObj) : c.configObj;

                return {
                    configObj: co,
                    providerMsgAry: p?.providerMsgAry.length === 0 ? p.providerMsgAry.concat(c.providerMsgAry) : c.providerMsgAry,
                };
            })
            .value();

        if (configObjWithMsgs.providerMsgAry.length > 0) {
            throw new ConfigValidateException(
                'config validate error',
                configObjWithMsgs.providerMsgAry.map(p => `${p.provider}  ${p.message}`)
            );
        }

        return configObjWithMsgs.configObj;
    }
}