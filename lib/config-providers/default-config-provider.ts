import { ConfigurationProvider } from ".";

export class DefaultConfigurationProvider extends ConfigurationProvider {

    constructor(private readonly configObject: any){
        super();
    }

    loadConfigObject() {
        return this.configObject;
    }
}