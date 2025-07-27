
import { ConfigurationProvider } from "./config-provider.abstract";
import { unflatten } from 'flat';
import minimist from 'minimist';
export class CommandlineConfigurationProvider extends ConfigurationProvider {

    constructor (){
        super();
    }

    override loadConfigObject() {
        const argv = minimist(process.argv.slice(2)) as Record<string, any>;
        // 去掉 _: [],
        delete argv._;

        // 必須將 --ary.0=1 --ary.1=2 所得到的 ary: { '0': 1, '1': 2 } }，轉換成
        // ary: [1, 2] 的形式
        // 這裡使用 unflatten 來處理
        const unflattenedArgv = unflatten(argv, { overwrite: true }) as Record<string, any>;
        return unflattenedArgv;
    }
}