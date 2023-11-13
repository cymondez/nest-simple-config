import { FileConfigurationProvider } from "./file-config-provider";
import * as fs from 'fs';
import * as yaml from 'js-yaml';
export class YamlConfigurationProvider extends FileConfigurationProvider {
    constructor(public readonly filename: fs.PathLike, optional = false){
        super(filename, optional, (filename) => {
            return yaml.load(
                fs.readFileSync(filename, 'utf8'),
              );
        })
    }
}