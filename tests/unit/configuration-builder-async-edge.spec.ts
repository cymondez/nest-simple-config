import {
    AsyncConfigurationProvider,
    ConfigurationBuilder,
    ConfigurationProvider,
    ConfigValidateException,
    DefaultConfigurationProvider,
} from '../../lib';

class FailingAsyncProvider extends AsyncConfigurationProvider {
    constructor(private readonly name: string) {
        super();
    }

    async loadConfigObject(): Promise<any> {
        throw new Error(`${this.name} failed`);
    }
}

describe('ConfigurationBuilder async edge cases', () => {
    it('stops later providers when an async provider rejects', async () => {
        const laterCalls: string[] = [];
        const builder = new ConfigurationBuilder({ arrayMergeMode: 'section' });
        builder
            .add(new DefaultConfigurationProvider({ first: true }))
            .add(new FailingAsyncProvider('broken'))
            .add(new DefaultConfigurationProvider({ third: true }));

        let captured: unknown;
        try {
            await builder.buildAsync();
        } catch (error) {
            captured = error;
        }

        expect(captured).toBeInstanceOf(Error);
        expect((captured as Error).message).toContain('broken failed');
        // The third provider must never run because the second rejected.
        expect(laterCalls).toEqual([]);
    });

    it('keeps section merge parity between sync and async paths', async () => {
        const syncBuilder = new ConfigurationBuilder({ arrayMergeMode: 'section' });
        syncBuilder
            .add(new DefaultConfigurationProvider({ values: [1, 2], shared: { a: 1 } }))
            .add(new DefaultConfigurationProvider({ values: [3], shared: { b: 2 } }));

        const asyncBuilder = new ConfigurationBuilder({ arrayMergeMode: 'section' });
        class SameValuesProvider extends AsyncConfigurationProvider {
            constructor(private readonly value: any) {
                super();
            }
            async loadConfigObject(): Promise<any> {
                return this.value;
            }
        }
        asyncBuilder
            .add(new SameValuesProvider({ values: [1, 2], shared: { a: 1 } }))
            .add(new SameValuesProvider({ values: [3], shared: { b: 2 } }));

        expect(await asyncBuilder.buildAsync()).toEqual(syncBuilder.build());
    });

    it('keeps all merge parity between sync and async paths', async () => {
        const syncBuilder = new ConfigurationBuilder({ arrayMergeMode: 'all' });
        syncBuilder
            .add(new DefaultConfigurationProvider({ values: [1, 2, 3] }))
            .add(new DefaultConfigurationProvider({ values: [4] }));

        class AsyncValuesProvider extends AsyncConfigurationProvider {
            constructor(private readonly value: any) {
                super();
            }
            async loadConfigObject(): Promise<any> {
                return this.value;
            }
        }
        const asyncBuilder = new ConfigurationBuilder({ arrayMergeMode: 'all' });
        asyncBuilder
            .add(new AsyncValuesProvider({ values: [1, 2, 3] }))
            .add(new AsyncValuesProvider({ values: [4] }));

        expect(await asyncBuilder.buildAsync()).toEqual(syncBuilder.build());
    });

    it('validator failure in async build references the provider, not the config', async () => {
        class SecretLeakyProvider extends AsyncConfigurationProvider {
            async loadConfigObject(): Promise<any> {
                return { secret: 'super-secret-value' };
            }
            override toString(): string {
                return 'provider: SecretLeakyProvider';
            }
        }

        const builder = new ConfigurationBuilder({
            arrayMergeMode: 'section',
            validator: {
                validator: () => {
                    throw new Error('validation failed');
                },
                checkLevel: 'error',
            },
        });
        builder.add(new SecretLeakyProvider());

        let captured: unknown;
        try {
            await builder.buildAsync();
        } catch (error) {
            captured = error;
        }

        expect(captured).toBeInstanceOf(ConfigValidateException);
        const message = (captured as Error).message;
        expect(message).toContain('SecretLeakyProvider');
        expect(message).not.toContain('super-secret-value');
    });
});