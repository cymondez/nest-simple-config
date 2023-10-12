import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import { Configuration } from '../../lib';

describe('Load json config file with include middle names', () => {

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

    // appsettings.override.json
    // {
    //     "a": "override",
    //     "b": {
    //         "c": 456,
    //         "d": 123
    //     },
    //     "ary": [11, 22] 
    // }

    let app: INestApplication;
  
    let configuration: Configuration;
    beforeEach(async () => {

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule.ArrayAllOverride()],
      }).compile();
  
      app = moduleFixture.createNestApplication();
      await app.init();

      configuration = app.get(Configuration);
    });

    it('get config a , vaule should be "override" ', () => {
        const a =  configuration.get<string>('a');
        expect(a).toEqual("override");
    });

    it('get override ary all, not section', () => {
      const ary =  configuration.get('ary');
      expect(ary).toEqual([11, 22] );
    });

    afterEach(async () => {
      await app.close();
    });
  });