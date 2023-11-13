import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import { Configuration } from '../../lib';

describe('Load json config file ', () => {

    // appsettings.json
    // {
    //     "a": "test",
    //     "b": {
    //         "c": 123
    //     }
    // }

    let app: INestApplication;
  
    let configuration: Configuration;

    const configObject =     {
            a: "test",
            b: {
                c: 123
            }
        };
    beforeEach(async () => {

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule.LoadJsonConfigFile()],
      }).compile();
  
      app = moduleFixture.createNestApplication();
      await app.init();

      configuration = app.get(Configuration);
    });

    it('get config section object, it should be immutable', () => {
        const b =  configuration.get('b');
        expect(b).toEqual(configObject.b)

        b["c"] = 'aaa';

        const other = configuration.get('b');

        expect(other).toEqual(configObject.b);
    });

    afterEach(async () => {
      await app.close();
    });
  });
  