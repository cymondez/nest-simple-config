import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import { Configuration } from '../../lib';

describe('get key with change path delimiter ', () => {

    // appsettings.json
    // {
    //     "a": "test",
    //     "b": {
    //         "c": 123
    //     }
    // }

    let app: INestApplication;
  
    let configuration: Configuration;

    beforeEach(async () => {

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule.ChangeKeyPathDelimiter()],
      }).compile();
  
      app = moduleFixture.createNestApplication();
      await app.init();

      configuration = app.get(Configuration);
    });
    it('get config b::c , vaule should be 123 ', () => {
        const c =  configuration.get('b::c');
        expect(c).toEqual(123);
    });

    afterEach(async () => {
      await app.close();
    });
  });
  