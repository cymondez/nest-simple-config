import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { AsyncConfigurationProvider } from './config-provider.abstract';
import { SecretConfigurationProviderOptions } from '../interfaces';
import { SecretStore } from '../secret-store';
import { keytarSecretStore } from '../keytar-secret-store';
import { resolveSecretService } from '../utils/secret-service-resolver';

const missingSecret = Symbol('missing-secret');
type ResolvedSecret = unknown | typeof missingSecret;

export abstract class SecretConfigurationProvider extends AsyncConfigurationProvider {
    constructor(
        public readonly filename: fs.PathLike,
        public readonly options: SecretConfigurationProviderOptions = {},
    ) {
        super();
    }

    protected readonly secretStore: SecretStore = this.options.store ?? keytarSecretStore;

    protected abstract loadSecretKeyObject(): unknown;

    override async loadConfigObject(): Promise<any> {
        if (!fs.existsSync(this.filename)) {
            if (this.options.optional) {
                return {};
            }
            throw new Error(`Secret configuration file does not exist: ${this.filename}`);
        }

        const keyObject = this.loadSecretKeyObject();
        if (keyObject === null || typeof keyObject !== 'object') {
            throw new Error(`Secret configuration file must contain an object or array: ${this.filename}`);
        }

        const service = resolveSecretService(this.options.service);
        const passwordCache = new Map<string, Promise<string | null>>();
        const configObject = await this.resolveNode(keyObject, service, [], passwordCache);

        return configObject === missingSecret ? {} : configObject;
    }

    private async resolveNode(
        node: unknown,
        service: string,
        configPath: string[],
        passwordCache: Map<string, Promise<string | null>>,
    ): Promise<ResolvedSecret> {
        if (typeof node === 'string') {
            if (node.length === 0) {
                return missingSecret;
            }

            try {
                let passwordPromise = passwordCache.get(node);
                if (!passwordPromise) {
                    passwordPromise = this.secretStore.getPassword(service, node);
                    passwordCache.set(node, passwordPromise);
                }
                const password = await passwordPromise;
                return password === null ? missingSecret : password;
            } catch (error) {
                const secretError = new Error(`Unable to load secret account "${node}" for service "${service}".`);
                (secretError as Error & { cause?: unknown }).cause = error;
                throw secretError;
            }
        }

        if (node === null || typeof node !== 'object') {
            throw this.invalidAccountError(configPath);
        }

        if (Array.isArray(node)) {
            const result: unknown[] = [];
            for (let index = 0; index < node.length; index++) {
                const value = await this.resolveNode(node[index], service, [...configPath, String(index)], passwordCache);
                if (value !== missingSecret) {
                    result.push(value);
                }
            }
            return result.length === 0 ? missingSecret : result;
        }

        const result: Record<string, unknown> = {};
        const entries = Object.entries(node as Record<string, unknown>);
        for (const [key, value] of entries) {
            const resolved = await this.resolveNode(value, service, [...configPath, key], passwordCache);
            if (resolved !== missingSecret) {
                result[key] = resolved;
            }
        }

        return Object.keys(result).length === 0 ? missingSecret : result;
    }

    private invalidAccountError(configPath: string[]): Error {
        const property = configPath.length > 0 ? configPath.join('.') : '<root>';
        return new Error(`Secret account at configuration property "${property}" must be a non-empty string.`);
    }

    override toString(): string {
        return `provider: ${this.constructor.name}, file: ${this.filename}`;
    }
}

export class JsonSecretConfigurationProvider extends SecretConfigurationProvider {
    protected override loadSecretKeyObject(): unknown {
        return JSON.parse(fs.readFileSync(this.filename, 'utf8'));
    }
}

export class YamlSecretConfigurationProvider extends SecretConfigurationProvider {
    protected override loadSecretKeyObject(): unknown {
        return yaml.load(fs.readFileSync(this.filename, 'utf8'));
    }
}
