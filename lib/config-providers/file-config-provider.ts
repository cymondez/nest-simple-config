import { PathLike, existsSync } from "fs";
import { ConfigurationProvider } from "./config-provider.abstract";

export class FileConfigurationProvider extends ConfigurationProvider {

    constructor(
        public readonly filename: PathLike,
        public readonly optional = false,
        protected readonly fileLoader: (path: PathLike)=> any) {
        super();
    }

    override loadConfigObject() {
        if (!existsSync(this.filename) && this.optional) {
            return {};
        }
        return this.fileLoader(this.filename);
    }

    override toString(): string {
        return `provider: ${this.constructor.name}, file: ${this.filename}`;
    }
}