import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Server } from 'http';



let server: Server;
let app: INestApplication;
describe('AppModule (e2e)', () => {
    let app: INestApplication;
  
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
  
      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });
  });
  