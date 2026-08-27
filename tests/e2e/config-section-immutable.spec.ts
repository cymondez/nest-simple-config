import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
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

    it('get config section object, it should be immutable - frozen object behavior', () => {
        const b = configuration.get('b');
        expect(b).toEqual(configObject.b);

        // Verify that the object is frozen
        expect(Object.isFrozen(b)).toBe(true);
        
        const originalValue = b.c;
        
        try {
            // Attempt to modify the frozen object property
            b["c"] = 'modified_value';
        } catch (error) {
            // TypeError should be thrown in strict mode
            expect(error).toBeInstanceOf(TypeError);
            expect(error.message).toMatch(/Cannot assign to read only property/);
        }
        
        // Regardless of whether an error is thrown, the value should not be modified (because the object is frozen)
        expect(b.c).toEqual(originalValue);
        expect(b.c).not.toEqual('modified_value');

        // Get configuration again to ensure the original config object is not modified
        const other = configuration.get('b');
        expect(other).toEqual(configObject.b);
        expect(other.c).toEqual(123);
    });

    it('get config section object, modification should throw error in strict mode', () => {
        const b = configuration.get('b');
        expect(b).toEqual(configObject.b);

        // Use strict mode function to test exception throwing
        const strictModeModification = () => {
            'use strict';
            b["c"] = 'should_throw_error';
        };

        // TypeError should be thrown in strict mode
        expect(strictModeModification).toThrow(TypeError);
        expect(strictModeModification).toThrow(/Cannot assign to read only property/);

        // Verify that the value remains unchanged
        expect(b.c).toEqual(123);
        
        // Get configuration again to ensure the original config object is not modified
        const other = configuration.get('b');
        expect(other).toEqual(configObject.b);
    });

    afterEach(async () => {
      await app.close();
    });
  });
  