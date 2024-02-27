export abstract class ConfigurationProvider {

    abstract loadConfigObject(): any;


    toString(): string {
        return `provider: ${this.constructor.name}`;
    }
}