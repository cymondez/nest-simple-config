import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { Server } from 'http';
import { Configuration } from '../../../lib';
describe('Load json config file with NODE_ENV', () => {

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
  
    let configuration: Configuration;
    beforeEach(async () => {

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule.LoadJsonConfigFileWithNodeEnv()],
      }).compile();
  
      app = moduleFixture.createNestApplication();
      await app.init();

      configuration = app.get(Configuration);
    });

    it('get config a , vaule should be "test" ', () => {
        const a =  configuration.get<string>('a');
        expect(a).toEqual("test");
    });

    it('get config b.c , vaule should be 456 ', () => {
        const c =  configuration.get('b.c');
        expect(c).toEqual(456);
    });

    it('get new property b.d, value should be 123', () => {
        const d =  configuration.get('b.d');
        expect(d).toEqual(123);
    });

    afterEach(async () => {
      await app.close();
    });
  });
  