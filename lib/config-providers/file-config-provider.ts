import { PathLike } from "fs";
import { ConfigurationProvider } from "./config-provider.abstract";

export class FileConfigurationProvider extends ConfigurationProvider {

    constructor(
        public readonly filename: PathLike,
        protected readonly fileLoader: (path: PathLike)=> any) {
        super();
    }

    override loadConfigObject() {
        return this.fileLoader(this.filename);
    }
    
}