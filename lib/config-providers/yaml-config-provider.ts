import { FileConfigurationProvider } from "./file-config-provider";
import * as fs from 'fs';
import * as yaml from 'js-yaml';
export class YamlConfigurationProvider extends FileConfigurationProvider {
    constructor(public readonly filename: fs.PathLike){
        super(filename, (filename) => {
            return yaml.load(
                fs.readFileSync(filename, 'utf8'),
              );
        })
    }
}