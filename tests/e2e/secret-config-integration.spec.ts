import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import {
    Configuration,
    ConfigurationBuilder,
    JsonConfigurationProvider,
    JsonSecretConfigurationProvider,
    YamlSecretConfigurationProvider,
    SimpleConfigModule,
} from '../../lib';
import { InMemorySecretStore } from '../src/in-memory-secret-store';

const baseSettingsDir = join(__dirname, '..', 'src', 'settings');
const secretSettingsDir = join(__dirname, '..', 'src', 'settings', 'secrets');

function createSecretStore(): InMemorySecretStore {
    return new InMemorySecretStore({
        'nest-simple-config': {
            'database.password': 'os-password',
            'empty.account': '',
            'shared.account': 'shared-value',
        },
        'override-service': {
            'database.password': 'override-password',
        },
        'integration-service': {
            'database.password': 'secret-password',
            'database.username': 'secret-username',
            'jwt.secret': 'jwt-value',
        },
    });
}

describe('Secret configuration integration through forRoot', () => {
    let app: INestApplication;
    let envBackup: NodeJS.ProcessEnv;
    let store: InMemorySecretStore;

    afterEach(async () => {
        process.env = envBackup;
        if (app) {
            await app.close();
        }
    });

    beforeEach(() => {
        envBackup = process.env;
        store = createSecretStore();
    });

    it('loads JSON secret key file through forRoot and resolves values from the store', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(baseSettingsDir, 'appsettings.json'),
                    },
                    secretConfigFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.secrets.json'),
                        store,
                    },
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.password')).toBe('os-password');
    });

    it('infers YAML format from the .yaml extension', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(baseSettingsDir, 'appsettings.json'),
                    },
                    secretConfigFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.secrets.yaml'),
                        store,
                    },
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.password')).toBe('os-password');
    });

    it('infers YAML format from the .yml extension', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(baseSettingsDir, 'appsettings.json'),
                    },
                    secretConfigFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.secrets.yml'),
                        store,
                    },
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.password')).toBe('os-password');
    });

    it('uses a filename without extension and defaults to JSON', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(baseSettingsDir, 'appsettings.json'),
                    },
                    secretConfigFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.secrets'),
                        store,
                    },
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.password')).toBe('os-password');
    });

    it('throws when an explicit fileType conflicts with the filename extension', () => {
        expect(() =>
            SimpleConfigModule.forRoot({
                secretConfigFileOptions: {
                    filename: join(secretSettingsDir, 'appsettings.secrets.json'),
                    fileType: 'yaml',
                    store,
                },
            }),
        ).toThrow(/does not match extension/);
    });

    it('uses the default optional secret file without error when it is missing', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.base.json'),
                    },
                    secretConfigFileOptions: {
                        filename: join(secretSettingsDir, 'definitely-missing.json'),
                        store,
                    },
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.host')).toBe('file-host');
    });

    it('rejects a required missing secret file', async () => {
        await expect(
            (async () => {
                const moduleFixture: TestingModule = await Test.createTestingModule({
                    imports: [
                        SimpleConfigModule.forRoot({
                            secretConfigFileOptions: {
                                filename: join(secretSettingsDir, 'required-missing.json'),
                                optional: false,
                                store,
                            },
                        }),
                    ],
                }).compile();

                app = moduleFixture.createNestApplication();
                await app.init();
            })(),
        ).rejects.toThrow(/does not exist/);
    });

    it('applies file -> secret -> env -> command-line precedence', async () => {
        process.env.App__database__password = 'env-password';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(baseSettingsDir, 'appsettings.json'),
                    },
                    secretConfigFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.secrets.json'),
                        store,
                    },
                    envOptions: {
                        prefix: 'App',
                    },
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.password')).toBe('env-password');
    });

    it('preserves earlier provider values when a secret account is missing', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.base.json'),
                    },
                    secretConfigFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.secrets.json'),
                        store,
                    },
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.host')).toBe('file-host');
        expect(configuration.get('database.password')).toBe('os-password');
        expect(configuration.get('fallback')).toBe('file-fallback');
    });

    it('uses an explicit service override instead of the package name', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRoot({
                    configFileOptions: {
                        filename: join(baseSettingsDir, 'appsettings.json'),
                    },
                    secretConfigFileOptions: {
                        filename: join(secretSettingsDir, 'appsettings.secrets.json'),
                        service: 'override-service',
                        store,
                    },
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.password')).toBe('override-password');
    });
});

describe('Secret configuration integration through forRootWithConfigBuilder', () => {
    let app: INestApplication;

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('loads secrets via a manually added provider and completes before Configuration is created', async () => {
        const store = createSecretStore();
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRootWithConfigBuilder((builder: ConfigurationBuilder) => {
                    builder.add(new JsonConfigurationProvider(join(secretSettingsDir, 'appsettings.base.json')))
                          .add(new JsonSecretConfigurationProvider(join(secretSettingsDir, 'appsettings.secrets.json'), { store }));
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.host')).toBe('file-host');
        expect(configuration.get('database.password')).toBe('os-password');
    });

    it('allows manual control of provider order so a secret can override a file value', async () => {
        const store = createSecretStore();
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SimpleConfigModule.forRootWithConfigBuilder((builder: ConfigurationBuilder) => {
                    builder.add(new JsonSecretConfigurationProvider(join(secretSettingsDir, 'appsettings.secrets.json'), { store }))
                          .add(new JsonConfigurationProvider(join(secretSettingsDir, 'appsettings.base.json')));
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const configuration = app.get(Configuration);
        expect(configuration.get('database.host')).toBe('file-host');
        expect(configuration.get('database.password')).toBe('file-password');
    });
});