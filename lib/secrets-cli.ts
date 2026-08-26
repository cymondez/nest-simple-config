import minimist from 'minimist';
import * as readline from 'readline';
import { keytarSecretStore } from './keytar-secret-store';
import { SecretStore } from './secret-store';
import { resolveSecretService } from './utils/secret-service-resolver';

export interface SecretsCliDependencies {
    store?: SecretStore;
    cwd?: string;
    readSecret?: () => Promise<string>;
    writeOutput?: (message: string) => void;
    writeError?: (message: string) => void;
}

const helpText = `Usage: nest-simple-config secrets <command> [account] [value] [options]

Commands:
  set <account> [value]  Save or replace a secret
  get <account>          Check whether a secret exists
  remove <account>       Remove a secret
  list                   List configured accounts
  clear                  Remove every account for the service

Options:
  --service <service>    Override the package.json project name
  --reveal               Print the value used by the get command
  --help                  Show this help
`;

export async function runSecretsCli(argv: string[], dependencies: SecretsCliDependencies = {}): Promise<number> {
    const parsed = minimist(argv, {
        string: ['_', 'service'],
        boolean: ['help', 'reveal'],
        alias: { h: 'help' },
    });
    const writeOutput = dependencies.writeOutput ?? (message => process.stdout.write(message));
    const writeError = dependencies.writeError ?? (message => process.stderr.write(message));
    const [namespace, command, account, positionalValue] = parsed._ as string[];

    if (parsed.help || namespace === undefined) {
        writeOutput(helpText);
        return 0;
    }
    if (namespace !== 'secrets' || command === undefined) {
        writeError(helpText);
        return 1;
    }

    let service: string;
    try {
        service = resolveSecretService(parsed.service, dependencies.cwd ?? process.cwd());
    } catch (error) {
        writeError(`${(error as Error).message}\n`);
        return 1;
    }

    const store = dependencies.store ?? keytarSecretStore;

    try {
        switch (command) {
            case 'set': {
                if (!account) {
                    writeError('The set command requires an account.\n');
                    return 1;
                }
                const password = positionalValue ?? await (dependencies.readSecret ?? readHiddenSecret)();
                await store.setPassword(service, account, password);
                writeOutput(`Secret account "${account}" was saved.\n`);
                return 0;
            }
            case 'get': {
                if (!account) {
                    writeError('The get command requires an account.\n');
                    return 1;
                }
                const password = await store.getPassword(service, account);
                if (password === null) {
                    writeOutput(`Secret account "${account}" is not configured.\n`);
                } else if (parsed.reveal) {
                    writeOutput(`${password}\n`);
                } else {
                    writeOutput(`Secret account "${account}" is configured.\n`);
                }
                return 0;
            }
            case 'remove':
            case 'delete': {
                if (!account) {
                    writeError(`The ${command} command requires an account.\n`);
                    return 1;
                }
                const deleted = await store.deletePassword(service, account);
                writeOutput(
                    deleted
                        ? `Secret account "${account}" was removed.\n`
                        : `Secret account "${account}" was not configured.\n`,
                );
                return 0;
            }
            case 'list': {
                const credentials = await store.findCredentials(service);
                const accounts = credentials.map(credential => credential.account).sort((left, right) =>
                    left.localeCompare(right),
                );
                if (accounts.length === 0) {
                    writeOutput('No secrets are configured for this service.\n');
                } else {
                    accounts.forEach(configuredAccount => writeOutput(`${configuredAccount}\n`));
                }
                return 0;
            }
            case 'clear': {
                const credentials = await store.findCredentials(service);
                await Promise.all(
                    credentials.map(credential => store.deletePassword(service, credential.account)),
                );
                writeOutput(`Removed ${credentials.length} secret account(s).\n`);
                return 0;
            }
            default:
                writeError(`Unknown secrets command: ${command}\n${helpText}`);
                return 1;
        }
    } catch {
        writeError(`Secret command "${command}" failed for service "${service}".\n`);
        return 1;
    }
}

export async function readHiddenSecret(): Promise<string> {
    const input = process.stdin;
    const output = process.stderr;

    if (!input.isTTY || typeof input.setRawMode !== 'function') {
        return new Promise((resolve, reject) => {
            const reader = readline.createInterface({ input, terminal: false });
            let resolved = false;
            const done = (value: string | Error) => {
                if (resolved) {
                    return;
                }
                resolved = true;
                reader.close();
                if (value instanceof Error) {
                    reject(value);
                } else {
                    resolve(value);
                }
            };
            reader.once('line', line => done(line));
            reader.once('close', () => done(''));
            reader.once('error', error => done(error));
        });
    }

    output.write('Secret value: ');
    return new Promise((resolve, reject) => {
        let password = '';
        const wasRaw = input.isRaw;

        const finish = (error?: Error) => {
            input.off('data', onData);
            input.setRawMode(Boolean(wasRaw));
            input.pause();
            output.write('\n');
            if (error) {
                reject(error);
            } else {
                resolve(password);
            }
        };

        const onData = (chunk: Buffer | string) => {
            const characters = chunk.toString();
            for (const character of characters) {
                if (character === '\r' || character === '\n') {
                    finish();
                    return;
                }
                if (character === '\u0003') {
                    finish(new Error('Secret input was cancelled.'));
                    return;
                }
                if (character === '\u007f' || character === '\b') {
                    password = password.slice(0, -1);
                } else {
                    password += character;
                }
            }
        };

        input.setRawMode(true);
        input.resume();
        input.on('data', onData);
    });
}
