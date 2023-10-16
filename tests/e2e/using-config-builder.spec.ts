import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import { Configuration } from '../../lib';
describe('Using ConfigurationBuilder', () => {

    // appsettings.json
    // {
    //     "a": "base",
    //     "b": {
    //         "c": 123
    //     }
    // }

    // appsettings.test.json  (in case NODE_ENV is 'test')
    // {
    //     "a": "test",
    //     "b": {
    //         "c": 456,
    //         "d": 123
    //     },
    //     "ary": [1, 2, 3] 
    // }

    let app: INestApplication;
    let envBackup: NodeJS.ProcessEnv;

    let configuration: Configuration;
    beforeEach(async () => {

        envBackup = process.env;


        process.env.App__a =  "env_override";
        process.env.App__b__d = "789";
        process.env.App__ary__0 = '11';
        process.env.App__ary__2 =  '33';
        process.env.App__ary__4 =  '55';


        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule.UsingConfigurationBuilder()],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        configuration = app.get(Configuration);
    });

    it('get config a , vaule should be "env_override" ', () => {
        const a = configuration.get<string>('a');
        expect(a).toEqual("env_override");
    });

    it('get new property b.d, value should be 789', () => {
        const d = configuration.get('b.d');
        expect(d).toEqual(789);
    });

    it('get override ary less,', () => {
        const ary =  configuration.get('ary');
        expect(ary).toEqual([11, 2, 33, undefined, 55] );
    });
  
    afterEach(async () => {
        process.env = envBackup;
        await app.close();
    });
});
