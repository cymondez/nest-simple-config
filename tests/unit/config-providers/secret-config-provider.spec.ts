import { join } from 'path';
import {
    JsonSecretConfigurationProvider,
    SecretStore,
    YamlSecretConfigurationProvider,
} from '../../../lib';
import { InMemorySecretStore } from '../../src/in-memory-secret-store';

const settingsPath = join(__dirname, '..', '..', 'src', 'settings', 'secrets');
const expectedConfig = {
    database: { password: 'os-password' },
    empty: '',
    duplicate: {
        first: 'shared-value',
        second: 'shared-value',
    },
};

function createStore(service = 'test-service'): InMemorySecretStore {
    return new InMemorySecretStore({
        [service]: {
            'database.password': 'os-password',
            'empty.account': '',
            'shared.account': 'shared-value',
        },
    });
}

describe('Secret configuration providers', () => {
    it('loads JSON mappings and omits accounts that do not exist', async () => {
        const store = createStore();
        const provider = new JsonSecretConfigurationProvider(
            join(settingsPath, 'appsettings.secrets.json'),
            { service: 'test-service', store },
        );

        await expect(provider.loadConfigObject()).resolves.toEqual(expectedConfig);
        expect(store.calls.filter(call => call.account === 'shared.account')).toHaveLength(1);
    });

    it.each(['appsettings.secrets.yaml', 'appsettings.secrets.yml'])(
        'loads %s mappings with the same result as JSON',
        async filename => {
            const store = createStore();
            const provider = new YamlSecretConfigurationProvider(join(settingsPath, filename), {
                service: 'test-service',
                store,
            });

            await expect(provider.loadConfigObject()).resolves.toEqual(expectedConfig);
        },
    );

    it('uses the current package name when service is not specified', async () => {
        const store = createStore('nest-simple-config');
        const provider = new JsonSecretConfigurationProvider(
            join(settingsPath, 'appsettings.secrets.json'),
            { store },
        );

        await provider.loadConfigObject();

        expect(store.calls[0].service).toBe('nest-simple-config');
    });

    it('returns an empty object for a missing optional file without using the store', async () => {
        const store = createStore();
        const provider = new JsonSecretConfigurationProvider(join(settingsPath, 'missing.json'), {
            service: 'test-service',
            optional: true,
            store,
        });

        await expect(provider.loadConfigObject()).resolves.toEqual({});
        expect(store.calls).toEqual([]);
    });

    it('rejects a missing required file', async () => {
        const provider = new JsonSecretConfigurationProvider(join(settingsPath, 'missing.json'), {
            service: 'test-service',
            store: createStore(),
        });

        await expect(provider.loadConfigObject()).rejects.toThrow(/does not exist/);
    });

    it('reports the config property for an invalid account mapping', async () => {
        const provider = new JsonSecretConfigurationProvider(
            join(settingsPath, 'invalid.secrets.json'),
            { service: 'test-service', store: createStore() },
        );

        await expect(provider.loadConfigObject()).rejects.toThrow(/database\.password.*non-empty string/);
    });

    it('does not expose a store error message as the provider error', async () => {
        const store: SecretStore = {
            getPassword: async () => { throw new Error('leaked-secret-value'); },
            setPassword: async () => undefined,
            deletePassword: async () => false,
            findCredentials: async () => [],
        };
        const provider = new JsonSecretConfigurationProvider(
            join(settingsPath, 'appsettings.secrets.json'),
            { service: 'test-service', store },
        );

        await expect(provider.loadConfigObject()).rejects.toThrow(
            'Unable to load secret account "database.password" for service "test-service".',
        );
        await provider.loadConfigObject().catch(error => {
            expect((error as Error).message).not.toContain('leaked-secret-value');
        });
    });
});
