import { runSecretsCli } from '../../lib/secrets-cli';
import { InMemorySecretStore } from '../src/in-memory-secret-store';

function deps(store: InMemorySecretStore) {
    const output: string[] = [];
    const errors: string[] = [];
    return {
        store,
        output,
        errors,
        writeOutput: (message: string) => output.push(message),
        writeError: (message: string) => errors.push(message),
    };
}

describe('secrets CLI', () => {
    let originalCwd: string;

    beforeEach(() => {
        originalCwd = process.cwd();
    });

    afterEach(() => {
        process.chdir(originalCwd);
    });

    it('set with a positional value stores the secret', async () => {
        const store = new InMemorySecretStore({ 'cli-service': {} });
        const inputs = deps(store);
        const code = await runSecretsCli(
            ['secrets', 'set', 'database.password', 'my-secret', '--service', 'cli-service'],
            inputs,
        );

        expect(code).toBe(0);
        expect(await store.getPassword('cli-service', 'database.password')).toBe('my-secret');
        expect(inputs.output.join('')).toContain('was saved');
    });

    it('set without a positional value uses the hidden input source', async () => {
        const store = new InMemorySecretStore({ 'cli-service': {} });
        const inputs = deps(store);
        const code = await runSecretsCli(['secrets', 'set', 'db.user', '--service', 'cli-service'], {
            ...inputs,
            readSecret: async () => 'hidden-value',
        });

        expect(code).toBe(0);
        expect(await store.getPassword('cli-service', 'db.user')).toBe('hidden-value');
    });

    it('get masks the value unless --reveal is used', async () => {
        const store = new InMemorySecretStore({
            'cli-service': { 'database.password': 'super-secret' },
        });
        const masked = deps(store);
        await runSecretsCli(['secrets', 'get', 'database.password', '--service', 'cli-service'], masked);

        expect(masked.output.join('')).toContain('is configured');
        expect(masked.output.join('')).not.toContain('super-secret');

        const revealed = deps(store);
        await runSecretsCli(
            ['secrets', 'get', 'database.password', '--reveal', '--service', 'cli-service'],
            revealed,
        );
        expect(revealed.output.join('')).toContain('super-secret');
    });

    it('get reports an unconfigured account', async () => {
        const store = new InMemorySecretStore({ 'cli-service': {} });
        const inputs = deps(store);
        await runSecretsCli(['secrets', 'get', 'missing.account', '--service', 'cli-service'], inputs);

        expect(inputs.output.join('')).toContain('not configured');
    });

    it('remove deletes a single account and reports when it did not exist', async () => {
        const store = new InMemorySecretStore({
            'cli-service': { 'database.password': 'value' },
        });
        const removed = deps(store);
        await runSecretsCli(['secrets', 'remove', 'database.password', '--service', 'cli-service'], removed);
        expect(removed.output.join('')).toContain('was removed');

        const absent = deps(store);
        await runSecretsCli(['secrets', 'delete', 'nothing', '--service', 'cli-service'], absent);
        expect(absent.output.join('')).toContain('was not configured');
    });

    it('list prints sorted accounts without leaking passwords', async () => {
        const store = new InMemorySecretStore({
            'cli-service': {
                'zeta.account': 'pw-z',
                'alpha.account': 'pw-a',
            },
        });
        const inputs = deps(store);
        await runSecretsCli(['secrets', 'list', '--service', 'cli-service'], inputs);

        const joined = inputs.output.join('');
        expect(joined).toContain('alpha.account');
        expect(joined).toContain('zeta.account');
        expect(joined).not.toContain('pw-a');
        expect(joined).not.toContain('pw-z');
        const alphaIndex = joined.indexOf('alpha.account');
        const zetaIndex = joined.indexOf('zeta.account');
        expect(alphaIndex).toBeLessThan(zetaIndex);
    });

    it('list reports when there are no secrets', async () => {
        const store = new InMemorySecretStore({ 'cli-service': {} });
        const inputs = deps(store);
        await runSecretsCli(['secrets', 'list', '--service', 'cli-service'], inputs);
        expect(inputs.output.join('')).toContain('No secrets are configured');
    });

    it('clear removes every account for the service', async () => {
        const store = new InMemorySecretStore({
            'cli-service': {
                'first.account': 'one',
                'second.account': 'two',
            },
        });
        const inputs = deps(store);
        await runSecretsCli(['secrets', 'clear', '--service', 'cli-service'], inputs);
        expect(inputs.output.join('')).toContain('Removed 2 secret account(s)');
        const remaining = await store.findCredentials('cli-service');
        expect(remaining).toEqual([]);
    });

    it('returns exit code 1 for an unknown command', async () => {
        const store = new InMemorySecretStore({ 'cli-service': {} });
        const inputs = deps(store);
        const code = await runSecretsCli(['secrets', 'explode', '--service', 'cli-service'], inputs);
        expect(code).toBe(1);
    });

    it('returns exit code 1 when a command requires an account that is missing', async () => {
        const store = new InMemorySecretStore({ 'cli-service': {} });
        const inputs = deps(store);
        const code = await runSecretsCli(['secrets', 'get', '--service', 'cli-service'], inputs);
        expect(code).toBe(1);
    });

    it('returns exit code 1 when service resolution fails', async () => {
        const store = new InMemorySecretStore({ 'cli-service': {} });
        const inputs = deps(store);
        const code = await runSecretsCli(['secrets', 'list'], {
            ...inputs,
            cwd: 'Z:\\\\non-existent-path-without-package-json',
        });
        expect(code).toBe(1);
    });

    it('uses the package.json name when --service is omitted', async () => {
        const store = new InMemorySecretStore({ 'nest-simple-config': { 'db.user': 'v' } });
        const inputs = deps(store);
        await runSecretsCli(['secrets', 'get', 'db.user'], inputs);
        expect(inputs.output.join('')).toContain('is configured');
    });

    it('a generic store failure returns exit code 1 and does not print the secret', async () => {
        const store = new InMemorySecretStore({ 'cli-service': { 'db.user': 'v' } });
        jest.spyOn(store, 'getPassword').mockRejectedValue(new Error('internal-store-leak'));
        const inputs = deps(store);
        const code = await runSecretsCli(['secrets', 'get', 'db.user', '--service', 'cli-service'], inputs);
        expect(code).toBe(1);
        expect(inputs.errors.join('')).toContain('failed for service');
        expect(inputs.errors.join('')).not.toContain('internal-store-leak');
    });

    it('shows help text when invoked with --help', async () => {
        const store = new InMemorySecretStore({ 'cli-service': {} });
        const inputs = deps(store);
        const code = await runSecretsCli(['--help'], inputs);
        expect(code).toBe(0);
        expect(inputs.output.join('')).toContain('Usage:');
    });
});