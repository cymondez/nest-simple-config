import { AsyncConfigurationProvider, ConfigurationProvider } from './config-providers';
import { ConfigurationBuilderOption } from '.';
import * as _ from 'lodash';
import { ConfigValidateException } from './exceptions/config-validate-exception';

export class ConfigurationBuilder {
    providers: ConfigurationProvider[] = [];

    constructor(public readonly options: ConfigurationBuilderOption) {}

    public add(provider: ConfigurationProvider): ConfigurationBuilder {
        this.providers.push(provider);
        return this;
    }

    public addRange(...providers: ConfigurationProvider[]): ConfigurationBuilder {
        for (const provider of providers) {
            this.providers.push(provider);
        }
        return this;
    }

    public hasAsyncProviders(): boolean {
        return this.providers.some(provider => provider instanceof AsyncConfigurationProvider);
    }

    public build(): any {
        const asyncProvider = this.providers.find(provider => provider instanceof AsyncConfigurationProvider);
        if (asyncProvider) {
            throw new Error(
                `Configuration provider ${asyncProvider.constructor.name} is asynchronous. Use buildAsync() instead of build().`,
            );
        }

        const configObjects = this.providers.map(provider => {
            const configObject = provider.loadConfigObject();
            if (this.isPromiseLike(configObject)) {
                void Promise.resolve(configObject).catch(() => undefined);
                throw new Error(
                    `Configuration provider ${provider.constructor.name} returned a Promise. Use buildAsync() instead of build().`,
                );
            }
            this.validate(provider, configObject);
            return configObject;
        });

        return this.merge(configObjects);
    }

    public async buildAsync(): Promise<any> {
        const configObjects: any[] = [];

        for (const provider of this.providers) {
            const configObject = await provider.loadConfigObject();
            this.validate(provider, configObject);
            configObjects.push(configObject);
        }

        return this.merge(configObjects);
    }

    private isPromiseLike(value: unknown): value is Promise<any> {
        return value !== null
            && (typeof value === 'object' || typeof value === 'function')
            && typeof (value as { then?: unknown }).then === 'function';
    }

    private validate(provider: ConfigurationProvider, configObject: any): void {
        if (!this.options.validator) {
            return;
        }

        let exception: Error | undefined;
        try {
            this.options.validator.validator(configObject);
        } catch (error) {
            exception = error as Error;
        }

        switch (this.options.validator.checkLevel) {
            case 'warn':
                if (exception) {
                    console.warn(`${provider.toString()} ${exception.message}`);
                }
                break;
            case 'error':
                if (exception) {
                    throw new ConfigValidateException(exception.message, [provider.toString()]);
                }
                break;
            case 'detail':
                break;
            default:
                throw new Error(`check level ${this.options.validator.checkLevel} not supports .`);
        }
    }

    private merge(configObjects: any[]): any {
        return configObjects.reduce((previous, current) => {
            if (previous === undefined) {
                return current;
            }

            switch (this.options.arrayMergeMode) {
                case 'section':
                    return _.merge(previous, current);
                case 'all':
                    return _.mergeWith(previous, current, (objectValue, sourceValue) =>
                        _.isArray(sourceValue) ? sourceValue : undefined,
                    );
                default:
                    throw new Error(`merge mode ${this.options.arrayMergeMode} not supports .`);
            }
        }, undefined);
    }
}
