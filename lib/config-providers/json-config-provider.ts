import { FileConfigurationProvider } from "./file-config-provider";
import * as fs from 'fs';

export class JsonConfigurationProvider extends FileConfigurationProvider {
    constructor(public readonly filename: fs.PathLike){
        super(filename, (filename) => {
            return JSON.parse(fs.readFileSync(filename, 'utf8'));
        })
    }
}