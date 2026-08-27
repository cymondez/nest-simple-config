import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { Configuration, SimpleConfigModule, CommandlineConfigurationProvider, JsonConfigurationProvider, EnvConfigurationProvider } from '../../../lib';
import { join } from 'path';

describe('SimpleConfigModule CommandlineConfigurationProvider Integration Tests', () => {
    let app: INestApplication;
    let config: Configuration;
    let originalArgv: string[];

    beforeAll(() => {
        // 備份原始的 process.argv
        originalArgv = process.argv.slice();
    });

    afterAll(() => {
        // 恢復原始的 process.argv
        process.argv = originalArgv;
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
        // 每個測試後恢復 process.argv
        process.argv = originalArgv.slice();
    });

    describe('forRoot() method with default commandline support', () => {
        it('should automatically include commandline provider with default settings', async () => {
            // 設定命令列參數
            process.argv = [
                'node',
                'script.js',
                '--database.host=commandline-host',
                '--database.port=9999',
                '--newSetting=from-commandline'
            ];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRoot({
                                configFileOptions: {
                                    filename: join(__dirname, '../../src/settings/appsettings.json')
                                }
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // 測試基本 JSON 配置仍然存在 (test環境會載入 appsettings.test.json)
            expect(config.get('a')).toBe('test');
            expect(config.get('b.c')).toBe(456);

            // 測試命令列參數覆寫和新增 (數值會被解析為數字)
            expect(config.get('database.host')).toBe('commandline-host');
            expect(config.get('database.port')).toBe(9999);
            expect(config.get('newSetting')).toBe('from-commandline');
        });

        it('should handle array arguments from commandline with forRoot', async () => {
            // 設定包含陣列的命令列參數
            process.argv = [
                'node',
                'script.js',
                '--servers.0.name=web1',
                '--servers.0.port=3001',
                '--servers.1.name=web2',
                '--servers.1.port=3002',
                '--tags.0=production',
                '--tags.1=web',
                '--tags.2=nodejs'
            ];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRoot({
                                configFileOptions: {
                                    filename: join(__dirname, '../../src/settings/appsettings.json')
                                }
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // 測試陣列配置 (數值會被 minimist 解析為數字)
            expect(config.get('servers')).toEqual([
                { name: 'web1', port: 3001 },
                { name: 'web2', port: 3002 }
            ]);
            expect(config.get('tags')).toEqual(['production', 'web', 'nodejs']);

            // 確保原始 JSON 配置仍然存在 (test環境)
            expect(config.get('a')).toBe('test');
        });

        it('should respect priority order with forRoot (commandline > env > json)', async () => {
            // 設定環境變數
            process.env.NestApp__a = 'from-env';
            process.env.NestApp__priority = 'env-value';

            // 設定命令列參數
            process.argv = [
                'node',
                'script.js',
                '--a=from-commandline',
                '--priority=commandline-value'
            ];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRoot({
                                configFileOptions: {
                                    filename: join(__dirname, '../../src/settings/appsettings.json')
                                },
                                envOptions: {
                                    prefix: 'NestApp'
                                }
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // 命令列參數應該有最高優先級
            expect(config.get('a')).toBe('from-commandline');
            expect(config.get('priority')).toBe('commandline-value');

            // 清理環境變數
            delete process.env.NestApp__a;
            delete process.env.NestApp__priority;
        });

        it('should work with no commandline arguments using forRoot', async () => {
            // 只使用 node script.js，沒有額外參數
            process.argv = ['node', 'script.js'];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRoot({
                                configFileOptions: {
                                    filename: join(__dirname, '../../src/settings/appsettings.json')
                                }
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // 應該只有 JSON 配置 (test環境)
            expect(config.get('a')).toBe('test');
            expect(config.get('b.c')).toBe(456);
        });
    });

    describe('forRootWithConfigBuilder() method with custom commandline configuration', () => {
        it('should integrate commandline config with json config files using builder', async () => {
            // 設定命令列參數
            process.argv = [
                'node',
                'script.js',
                '--database.host=commandline-host',
                '--database.port=9999',
                '--newSetting=from-commandline'
            ];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRootWithConfigBuilder((builder) => {
                                builder
                                    .add(new JsonConfigurationProvider(join(__dirname, '../../src/settings/appsettings.json')))
                                    .add(new CommandlineConfigurationProvider());
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // 測試基本 JSON 配置仍然存在
            expect(config.get('a')).toBe('base');  // builder 直接指定文件，不會載入 .test.json
            expect(config.get('b.c')).toBe(123);

            // 測試命令列參數覆寫和新增 (數值會被解析為數字)
            expect(config.get('database.host')).toBe('commandline-host');
            expect(config.get('database.port')).toBe(9999);
            expect(config.get('newSetting')).toBe('from-commandline');
        });

        it('should handle array arguments from commandline with builder', async () => {
            // 設定包含陣列的命令列參數
            process.argv = [
                'node',
                'script.js',
                '--servers.0.name=web1',
                '--servers.0.port=3001',
                '--servers.1.name=web2',
                '--servers.1.port=3002',
                '--tags.0=production',
                '--tags.1=web',
                '--tags.2=nodejs'
            ];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRootWithConfigBuilder((builder) => {
                                builder
                                    .add(new JsonConfigurationProvider(join(__dirname, '../../src/settings/appsettings.json')))
                                    .add(new CommandlineConfigurationProvider());
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // 測試陣列配置 (數值會被 minimist 解析為數字)
            expect(config.get('servers')).toEqual([
                { name: 'web1', port: 3001 },
                { name: 'web2', port: 3002 }
            ]);
            expect(config.get('tags')).toEqual(['production', 'web', 'nodejs']);

            // 確保原始 JSON 配置仍然存在
            expect(config.get('a')).toBe('base');
        });

        it('should respect configuration priority order with builder (commandline > env > json)', async () => {
            // 設定環境變數
            process.env.App__a = 'from-env';
            process.env.App__priority = 'env-value';

            // 設定命令列參數
            process.argv = [
                'node',
                'script.js',
                '--a=from-commandline',
                '--priority=commandline-value'
            ];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRootWithConfigBuilder((builder) => {
                                builder
                                    .add(new JsonConfigurationProvider(join(__dirname, '../../src/settings/appsettings.json')))
                                    .add(new EnvConfigurationProvider({ prefix: 'App' }))
                                    .add(new CommandlineConfigurationProvider());
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // 命令列參數應該有最高優先級
            expect(config.get('a')).toBe('from-commandline');
            expect(config.get('priority')).toBe('commandline-value');

            // 清理環境變數
            delete process.env.App__a;
            delete process.env.App__priority;
        });

        it('should handle complex nested array structures from commandline with builder', async () => {
            process.argv = [
                'node',
                'script.js',
                '--microservices.0.name=auth-service',
                '--microservices.0.instances.0.host=auth1.example.com',
                '--microservices.0.instances.0.port=3001',
                '--microservices.0.instances.1.host=auth2.example.com',
                '--microservices.0.instances.1.port=3002',
                '--microservices.1.name=user-service',
                '--microservices.1.instances.0.host=user1.example.com',
                '--microservices.1.instances.0.port=3003'
            ];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRootWithConfigBuilder((builder) => {
                                builder
                                    .add(new JsonConfigurationProvider(join(__dirname, '../../src/settings/appsettings.json')))
                                    .add(new CommandlineConfigurationProvider());
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            const expectedMicroservices = [
                {
                    name: 'auth-service',
                    instances: [
                        { host: 'auth1.example.com', port: 3001 },  // 數字
                        { host: 'auth2.example.com', port: 3002 }   // 數字
                    ]
                },
                {
                    name: 'user-service',
                    instances: [
                        { host: 'user1.example.com', port: 3003 }   // 數字
                    ]
                }
            ];

            expect(config.get('microservices')).toEqual(expectedMicroservices);
        });

        it('should handle boolean and numeric-like string values from commandline with builder', async () => {
            process.argv = [
                'node',
                'script.js',
                '--debug=true',
                '--verbose=false',
                '--maxRetries=5',
                '--timeout=30000',
                '--enableFeature'  // boolean flag without value
            ];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRootWithConfigBuilder((builder) => {
                                builder
                                    .add(new JsonConfigurationProvider(join(__dirname, '../../src/settings/appsettings.json')))
                                    .add(new CommandlineConfigurationProvider());
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // minimist 保持字串形式的布林值，但會將純數字解析為數字
            expect(config.get('debug')).toBe('true');
            expect(config.get('verbose')).toBe('false');
            expect(config.get('maxRetries')).toBe(5);       // 數字
            expect(config.get('timeout')).toBe(30000);      // 數字
            expect(config.get('enableFeature')).toBe(true); // 布林值
        });

        it('should work with no commandline arguments using builder', async () => {
            // 只使用 node script.js，沒有額外參數
            process.argv = ['node', 'script.js'];

            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    {
                        module: AppModule,
                        imports: [
                            SimpleConfigModule.forRootWithConfigBuilder((builder) => {
                                builder
                                    .add(new JsonConfigurationProvider(join(__dirname, '../../src/settings/appsettings.json')))
                                    .add(new CommandlineConfigurationProvider());
                            })
                        ]
                    }
                ],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
            config = app.get<Configuration>(Configuration);

            // 應該只有 JSON 配置
            expect(config.get('a')).toBe('base');
            expect(config.get('b.c')).toBe(123);
        });
    });
});
