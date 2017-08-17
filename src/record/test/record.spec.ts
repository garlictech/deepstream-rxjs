import { Record } from '..'
import { EventEmitter } from 'events';

import { TestDB } from './fixtures';

let deepstream = require('deepstream.io-client-js')

describe('Record', () => {
  let testDb: TestDB;

  class MockRecord {
    getRecord = jasmine.createSpy('getRecord').and.callFake((path: string) => {
      let record = testDb.get(path);

      return {
        subscribe: (callback, fire) => {
          if (fire === true) {
            callback(record);
          }

          testDb.on('record.changed', (changedPath, value) => {
            if (changedPath === path) {
              callback(value);
            }
          });
        },
        unsubscribe: () => {},
        set: (value, callback) => {
          testDb.set(path, value);
          callback();
        },
        whenReady: (callback) => {
          callback();
        }
      };
    });

    getList = jasmine.createSpy('getList').and.callFake((path: string) => {
      return {
        subscribe: (callback, fire) => {
          if (fire === true) {
            callback(testDb.getList());
          }

          testDb.on('list.changed', () => callback(testDb.getList()));
        },
        unsubscribe: () => {},
        addEntry: (value, callback) => {
          testDb.addEntry(value);
          callback();
        },
        whenReady: (callback) => {
          callback();
        }        
      };
    });
  }

  class MockDeepstream extends EventEmitter {
    private _state = deepstream.CONSTANTS.CONNECTION_STATE.OPEN
    public record = new MockRecord();

    constructor() {
      super()
    }
  }

  let mockDeepstream: any;
  let record: Record;

  beforeEach(() => {
    mockDeepstream = new MockDeepstream();
    record = new Record(mockDeepstream);
    testDb = new TestDB();
  });

  afterEach(() => {
    testDb.removeAllListeners();
  });
  
  it('should subscribe to a record', (done) => {
    record
      .record('test/1')
      .take(1)
      .subscribe((value) => {
        expect(value.name).toEqual('test1');
        done();
      }, (err) => {
        done.fail(err);
      });
  });

  it('should notified when the record changed', (done) => {
    record
      .record('test/1')
      // Skip the initial value
      .skip(1)
      .take(1)
      .subscribe((value) => {
        expect(value.name).toEqual('test-changed');
        done();
      }, (err) => {
        done.fail(err);
      });

    testDb.setValue('test/1', 'name', 'test-changed');
  });  

/*  it('should set the record\'s value', (done) => {

  });

  it('should subscribe to a list', (done) => {

  });

  it('should push a value to the list', (done) => {

  });*/

});

