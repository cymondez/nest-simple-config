import {
    AsyncConfigurationProvider,
    ConfigurationBuilder,
    ConfigurationProvider,
    DefaultConfigurationProvider,
} from '../../lib';

class TrackedProvider extends ConfigurationProvider {
    constructor(
        private readonly name: string,
        private readonly value: any,
        private readonly calls: string[],
    ) {
        super();
    }

    loadConfigObject(): any {
        this.calls.push(this.name);
        return this.value;
    }
}

class TrackedAsyncProvider extends AsyncConfigurationProvider {
    constructor(
        private readonly name: string,
        private readonly value: any,
        private readonly calls: string[],
    ) {
        super();
    }

    async loadConfigObject(): Promise<any> {
        this.calls.push(this.name);
        return this.value;
    }
}

describe('ConfigurationBuilder asynchronous providers', () => {
    it('loads and merges synchronous and asynchronous providers in insertion order', async () => {
        const calls: string[] = [];
        const builder = new ConfigurationBuilder({ arrayMergeMode: 'section' });
        builder
            .add(new TrackedProvider('first', { value: 'file', nested: { first: true } }, calls))
            .add(new TrackedAsyncProvider('second', { value: 'secret' }, calls))
            .add(new TrackedProvider('third', { value: 'environment', nested: { third: true } }, calls));

        await expect(builder.buildAsync()).resolves.toEqual({
            value: 'environment',
            nested: { first: true, third: true },
        });
        expect(calls).toEqual(['first', 'second', 'third']);
    });

    it('rejects a marked asynchronous provider before invoking any provider', () => {
        const calls: string[] = [];
        const builder = new ConfigurationBuilder({ arrayMergeMode: 'section' });
        builder
            .add(new TrackedProvider('first', { value: 1 }, calls))
            .add(new TrackedAsyncProvider('secret', { value: 2 }, calls));

        expect(() => builder.build()).toThrow(/TrackedAsyncProvider.*buildAsync/);
        expect(calls).toEqual([]);
    });

    it('detects an unmarked provider that returns a bare thenable', () => {
        class ThenableProvider extends ConfigurationProvider {
            loadConfigObject(): any {
                return {
                    then(resolve: (value: any) => void) {
                        resolve({ value: 'async' });
                    },
                };
            }
        }

        const builder = new ConfigurationBuilder({ arrayMergeMode: 'section' });
        builder.add(new ThenableProvider());

        expect(() => builder.build()).toThrow(/ThenableProvider.*buildAsync/);
    });

    it('keeps synchronous build and array merge behavior unchanged', () => {
        const builder = new ConfigurationBuilder({ arrayMergeMode: 'all' });
        builder
            .add(new DefaultConfigurationProvider({ values: [1, 2, 3] }))
            .add(new DefaultConfigurationProvider({ values: [4] }));

        expect(builder.build()).toEqual({ values: [4] });
    });

    it('validates each resolved provider before merging', async () => {
        const validated: any[] = [];
        const builder = new ConfigurationBuilder({
            arrayMergeMode: 'section',
            validator: {
                checkLevel: 'error',
                validator: config => validated.push(structuredClone(config)),
            },
        });
        builder
            .add(new DefaultConfigurationProvider({ first: true }))
            .add(new TrackedAsyncProvider('secret', { second: true }, []));

        await builder.buildAsync();

        expect(validated).toEqual([{ first: true }, { second: true }]);
    });
});
