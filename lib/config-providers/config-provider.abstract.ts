export abstract class ConfigurationProvider {

    abstract loadConfigObject(): any;


    toString(): string {
        return `provider: ${this.constructor.name}`;
    }
}

export abstract class AsyncConfigurationProvider extends ConfigurationProvider {
    abstract override loadConfigObject(): Promise<any>;
}
