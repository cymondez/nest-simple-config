import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { JsonSecretConfigurationProvider, SecretStore } from '../../../lib';
import { InMemorySecretStore } from '../../src/in-memory-secret-store';

function writeTmpFile(content: string): { dir: string; file: string } {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'secret-edge-'));
    const file = path.join(dir, 'mapping.json');
    fs.writeFileSync(file, content, 'utf8');
    return { dir, file };
}

function leakyStore(): SecretStore {
    return {
        getPassword: async () => { throw new Error('store-internal-leak'); },
        setPassword: async () => undefined,
        deletePassword: async () => false,
        findCredentials: async () => [],
    };
}

describe('Secret configuration provider edge cases', () => {
    let tmpDirs: string[] = [];

    afterEach(() => {
        tmpDirs.forEach(dir => fs.rmSync(dir, { recursive: true, force: true }));
        tmpDirs = [];
    });

    function writeFixture(content: string): string {
        const fixture = writeTmpFile(content);
        tmpDirs.push(fixture.dir);
        return fixture.file;
    }

    it('treats an empty-string account as a missing entry and omits it', async () => {
        const store = new InMemorySecretStore({ 'svc': { 'real.account': 'value' } });
        const file = writeFixture(JSON.stringify({
            real: 'real.account',
            branch: { empty: '' },
        }));
        const provider = new JsonSecretConfigurationProvider(file, { service: 'svc', store });

        // The design: empty mapping value means the leaf should be omitted
        // rather than querying the store for an empty account.
        const result = await provider.loadConfigObject();
        expect(result).toEqual({ real: 'value' });
    });

    it('rejects a scalar root value', async () => {
        const store = new InMemorySecretStore();
        const file = writeFixture(JSON.stringify('just-a-string'));
        const provider = new JsonSecretConfigurationProvider(file, { service: 'svc', store });

        await expect(provider.loadConfigObject()).rejects.toThrow(/must contain an object or array/);
    });

    it('rejects a null root value', async () => {
        const store = new InMemorySecretStore();
        const file = writeFixture(JSON.stringify(null));
        const provider = new JsonSecretConfigurationProvider(file, { service: 'svc', store });

        await expect(provider.loadConfigObject()).rejects.toThrow(/must contain an object or array/);
    });

    it('resolves array roots and preserves sparse results', async () => {
        const store = new InMemorySecretStore({
            'svc': {
                'arr.0': 'zero',
                'arr.2': 'two',
            },
        });
        const file = writeFixture(JSON.stringify([
            'arr.0',
            'missing.account',
            'arr.2',
        ]));
        const provider = new JsonSecretConfigurationProvider(file, { service: 'svc', store });

        const result = await provider.loadConfigObject();
        // Missing account in the middle must not create a hole at index 1.
        expect(result).toEqual(['zero', 'two']);
    });

    it('does not leak a store error message through the provider error', async () => {
        const store = leakyStore();
        const file = writeFixture(JSON.stringify({ password: 'database.password' }));
        const provider = new JsonSecretConfigurationProvider(file, { service: 'svc', store });

        let captured: unknown;
        try {
            await provider.loadConfigObject();
        } catch (error) {
            captured = error;
        }

        expect(captured).toBeInstanceOf(Error);
        const message = (captured as Error).message;
        expect(message).toContain('Unable to load secret account "database.password"');
        expect(message).not.toContain('store-internal-leak');
    });

    it('preserves an empty string secret as a valid value', async () => {
        const store = new InMemorySecretStore({ 'svc': { 'empty.account': '' } });
        const file = writeFixture(JSON.stringify({ key: 'empty.account' }));
        const provider = new JsonSecretConfigurationProvider(file, { service: 'svc', store });

        const result = await provider.loadConfigObject();
        expect(result).toEqual({ key: '' });
    });

    it('returns an empty object when every leaf account is missing', async () => {
        const store = new InMemorySecretStore({ 'svc': {} });
        const file = writeFixture(JSON.stringify({
            a: 'missing.a',
            b: { c: 'missing.c' },
        }));
        const provider = new JsonSecretConfigurationProvider(file, { service: 'svc', store });

        const result = await provider.loadConfigObject();
        expect(result).toEqual({});
    });
});