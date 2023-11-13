import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { Server } from 'http';
import { Configuration } from '../../../lib';
describe('Using ConfigurationBuilder', () => {

    // appsettings.json
    // {
    //     "a": "base",
    //     "b": {
    //         "c": 123
    //     }
    // }

    // appsettings.test.json  ('not exists')

    let app: INestApplication;
    let envBackup: NodeJS.ProcessEnv;

    let configuration: Configuration;
    beforeEach(async () => {

        envBackup = process.env;

        process.env.App__b__d = "789";


        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule.testFileConfigurationProviderOptional()],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        configuration = app.get(Configuration);
    });

    it('get config a , value should be "base" ', () => {
        const a = configuration.get<string>('a');
        expect(a).toEqual("base");
    });

    it('get new property b.d, value should be 789', () => {
        const d = configuration.get('b.d');
        expect(d).toEqual(789);
    });

    afterEach(async () => {
        process.env = envBackup;
        await app.close();
    });
});
