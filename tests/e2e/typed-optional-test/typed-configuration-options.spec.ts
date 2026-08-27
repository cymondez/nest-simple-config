import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ConfigTestService } from '../../src/typed-optionals/config-test.service';
import { DatabaseOptions } from '../../src/typed-optionals/database-options';
import { ServerOptions } from '../../src/typed-optionals/server-options';

describe('Typed Configuration Options Integration Tests', () => {
    let validApp: INestApplication;
    let configService: ConfigTestService;

    beforeAll(async () => {
        // 只創建一次有效配置的應用程序
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule.withValidTypedConfig()]
        }).compile();

        validApp = moduleFixture.createNestApplication();
        await validApp.init();

        configService = validApp.get(ConfigTestService);
    });

    afterAll(async () => {
        if (validApp) {
            await validApp.close();
        }
    });

    describe('Configuration Loading and Validation', () => {
        it('should load and validate database configuration', () => {
            const dbConfig = configService.getDatabaseConfig();

            expect(dbConfig).toBeInstanceOf(DatabaseOptions);
            expect(dbConfig.host).toBe('localhost');
            expect(dbConfig.port).toBe(5432);
            expect(dbConfig.username).toBe('admin');
            expect(dbConfig.password).toBe('secret123');
            expect(dbConfig.database).toBe('testdb');
        });

        it('should load and validate nested pool configuration', () => {
            const dbConfig = configService.getDatabaseConfig();

            expect(dbConfig.pool).toBeDefined();
            expect(dbConfig.pool!.min).toBe(5);
            expect(dbConfig.pool!.max).toBe(20);
            expect(dbConfig.pool!.timeout).toBe(30000);
        });

        it('should load and validate server configuration', () => {
            const serverConfig = configService.getServerConfig();

            expect(serverConfig).toBeInstanceOf(ServerOptions);
            expect(serverConfig.host).toBe('0.0.0.0');
            expect(serverConfig.port).toBe(3000);
            expect(serverConfig.ssl).toBe(true);
            expect(serverConfig.environment).toBe('test');
        });

        it('should validate range constraints', () => {
            const dbConfig = configService.getDatabaseConfig();

            // Port should be within valid range (1-65535)
            expect(dbConfig.port).toBeGreaterThan(0);
            expect(dbConfig.port).toBeLessThanOrEqual(65535);

            // Pool settings should be within valid range
            expect(dbConfig.pool!.min).toBeGreaterThanOrEqual(1);
            expect(dbConfig.pool!.min).toBeLessThanOrEqual(100);
            expect(dbConfig.pool!.max).toBeGreaterThanOrEqual(1);
            expect(dbConfig.pool!.max).toBeLessThanOrEqual(500);
        });
    });

    describe('Type Safety and Transformations', () => {
        it('should ensure configuration is strongly typed', () => {
            const dbConfig = configService.getDatabaseConfig();
            const serverConfig = configService.getServerConfig();

            // TypeScript should enforce these types at compile time
            expect(typeof dbConfig.host).toBe('string');
            expect(typeof dbConfig.port).toBe('number');
            expect(typeof serverConfig.ssl).toBe('boolean');
        });

        it('should transform string numbers to actual numbers', () => {
            const dbConfig = configService.getDatabaseConfig();
            
            // Even if JSON contains numbers as strings, they should be transformed to numbers
            expect(typeof dbConfig.port).toBe('number');
            expect(dbConfig.port).toBe(5432);
        });

        it('should transform nested objects correctly', () => {
            const dbConfig = configService.getDatabaseConfig();
            
            expect(dbConfig.pool).toBeDefined();
            expect(typeof dbConfig.pool!.min).toBe('number');
            expect(typeof dbConfig.pool!.max).toBe('number');
            expect(typeof dbConfig.pool!.timeout).toBe('number');
        });

        it('should handle optional properties correctly', () => {
            const dbConfig = configService.getDatabaseConfig();
            const serverConfig = configService.getServerConfig();
            
            // Pool is optional but present in our test config
            expect(dbConfig.pool).toBeDefined();
            
            // These are optional and present
            expect(serverConfig.ssl).toBeDefined();
            expect(serverConfig.environment).toBeDefined();
        });
    });

    describe('Service Methods', () => {
        it('should generate correct connection string from validated config', () => {
            const connectionString = configService.getConnectionString();
            expect(connectionString).toBe('postgresql://admin:secret123@localhost:5432/testdb');
        });

        it('should generate correct server URL from validated config', () => {
            const serverUrl = configService.getServerUrl();
            expect(serverUrl).toBe('https://0.0.0.0:3000');
        });
    });

    describe('Error Handling', () => {
        it('should throw validation errors for invalid configuration', async () => {
            let error: Error | undefined;

            try {
                const moduleFixture: TestingModule = await Test.createTestingModule({
                    imports: [AppModule.withInvalidTypedConfig()]
                }).compile();

                const invalidApp = moduleFixture.createNestApplication();
                await invalidApp.init();
            } catch (e) {
                error = e as Error;
            }

            expect(error).toBeDefined();
            expect(error!.message).toContain('Invalid config');
            
            // Should contain validation errors for both DatabaseOptions and ServerOptions
            expect(error!.message).toMatch(/DatabaseOptions|ServerOptions/);
        });
    });
});
