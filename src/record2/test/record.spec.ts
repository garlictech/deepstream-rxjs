import { Record } from '..'
import { EventEmitter } from 'events';

import { TestDB } from './fixtures';

let deepstream = require('deepstream.io-client-js')

describe('Record', () => {
  let testDb: TestDB;
  let recordUnsubscribeSpy;
  let listUnsubscribeSpy;
  let listDeleteSpy;

  class MockRecord {
    getRecord = jasmine.createSpy('getRecord').and.callFake((path: string) => {
      let record = testDb.get(path);
      let id = path.replace(/test\//, '');

      return {
        subscribe: (callback, fire) => {
          if (fire === true) {
            callback(record);
          }

          testDb.on(`record.changed.${id}`, (changedPath, value) => {
            callback(value);
          });
        },
        unsubscribe: recordUnsubscribeSpy.and.callFake(() => {
          testDb.removeAllListeners(`record.changed.${id}`);
        }),
        set: (fieldOrValue, value, callback?) => {
          if (path === 'test/999') {
            
            if (typeof callback === 'undefined') {
              callback = value;
            }

            callback(new Error('Set failed'));
          } else {
            if (typeof callback === 'undefined') {
              callback = value;
              value = fieldOrValue;
              testDb.set(path, value);
            } else {
              testDb.setValue(path, fieldOrValue, value);
            }
  
            callback();
          }
        },
        whenReady: (callback) => {
          callback();
        }
      };
    });

    getList = jasmine.createSpy('getList').and.callFake((path: string) => {
      return {
        name: path,
        subscribe: (callback, fire) => {
          if (fire === true) {
            callback(testDb.getList(path));
          }

          testDb.on('list.changed', () => callback(testDb.getList(path)));
        },
        unsubscribe: listUnsubscribeSpy.and.callFake(() => {
          testDb.removeAllListeners(`list.changed`);
        }),
        delete: listDeleteSpy.and.callFake(() => {
          testDb.removeAllListeners(`list.changed`);
        }),
        addEntry: (value) => {
          testDb.addEntry(value);
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
    public lastUid = 1000;

    public getUid(): string {
      let uid = this.lastUid++;

      return uid.toString();
    }

    constructor() {
      super()
    }
  }

  let mockDeepstream: any;
  let record: Record;

  beforeEach(() => {
    recordUnsubscribeSpy = jasmine.createSpy('unsubscribe');
    listUnsubscribeSpy = jasmine.createSpy('unsubscribe');
    listDeleteSpy = jasmine.createSpy('delete');
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
      .subscribe((value) => {
        expect(value.name).toEqual('test1');
        done();
      }, done.fail);
  });

  it('should notified when the record changed', (done) => {
    record
      .record('test/1')
      // Skip the initial value
      .skip(1)
      .subscribe((value) => {
        expect(value.name).toEqual('test-changed');
        done();
      }, done.fail);

    testDb.setValue('test/1', 'name', 'test-changed');
  });

  it('should unsubscribe from the record', (done) => {
    let subscription = record
      .record('test/1')
      // Skip initial value
      .skip(1)
      .subscribe(() => {
        done.fail(new Error('Subscribe called'));
      }, done.fail);

      subscription.unsubscribe();

      testDb.setValue('test/1', 'name', 'xxx');

      expect(recordUnsubscribeSpy).toHaveBeenCalled();
      done();
  });

  it('should set a field\'s value', (done) => {
    record
      .record('test/1')
      .set('name', 'test-changed2')
      .then(() => {
        let testRecord = testDb.get('test/1');
        expect(testRecord.name).toEqual('test-changed2');
        done();
      })
      .catch((err) => done.fail(err));
  });

  it('should throw error when set failed', (done) => {
    record
    .record('test/999')
    .set('name', 'test-changed2')
    .then(() => done.fail(new Error('Not failed!')))
    .catch((err: Error) => {
      let testRecord = testDb.get('test/999');
      expect(err.message).toEqual('Set failed');
      expect(testRecord).toBeUndefined();
      done();
    });
  });

  it('should set a records value', (done) => {
    record
      .record('test/1')
      .set({
        id: 'test1',
        extra: 'test',
        name: 'test-changed3'
      })
      .then(() => {
        let testRecord = testDb.get('test/1');
        expect(testRecord.name).toEqual('test-changed3');
        expect(testRecord.extra).toEqual('test');
        done();
      })
      .catch((err) => done.fail(err));
  });  

  it('should subscribe to a list', (done) => {
    record
      .list('test')
      .subscribe(list => {
        let keys  = Object.keys(testDb.records);
        let count = keys.length;

        expect(list instanceof Array).toBeTruthy();
        expect(list.length).toEqual(count);

        keys.forEach(key => {
          let data = testDb.get(key);
          expect(typeof data.id === 'string').toBeTruthy();
          expect(typeof data.name === 'string').toBeTruthy();
          expect(data.id.match(/^[0-9]$/)).not.toBeNull();
        });

        done();
      }, done.fail);

  });

  it('should query a list', (done) => {
    let queryString = JSON.stringify({
      table: 'test',
      query: [
        ['name', 'match', 'test.*']
      ]
    });

    record
      .list(`search?${queryString}`)
      .subscribe(list => {
        let keys  = Object.keys(testDb.records);
        let count = keys.length;

        expect(list instanceof Array).toBeTruthy();
        expect(list.length).toEqual(count - 1);

        keys.forEach(key => {
          let data = testDb.get(key);
          expect(typeof data.id === 'string').toBeTruthy();
          expect(typeof data.name === 'string').toBeTruthy();
          expect(data.id.match(/^[0-9]$/)).not.toBeNull();
        });

        done();
      }, done.fail);

  });

  it('should unsubscribe from the list', (done) => {
    let subscription = record
      .list('test')
      // Skip initial value
      .skip(1)
      .subscribe(() => {
        done.fail(new Error('Subscribe called'));
      }, done.fail);

      subscription.unsubscribe();

      testDb.addEntry('5000');

      expect(listUnsubscribeSpy).toHaveBeenCalled();
      done();
  });
  
  it('should delete the query', (done) => {
    let queryString = JSON.stringify({
      table: 'test',
      query: [
        ['name', 'match', 'test.*']
      ]
    });
    
    let subscription = record
      .list(`search?${queryString}`)
      // Skip initial value
      .skip(1)
      .subscribe(() => {
        done.fail(new Error('Subscribe called'));
      }, done.fail);

      subscription.unsubscribe();

      testDb.addEntry('5000');

      expect(listUnsubscribeSpy).not.toHaveBeenCalled();
      expect(listDeleteSpy).toHaveBeenCalled();
      done();
  });    

  it('should push a value to the list', (done) => {
    record
      .list('test')
      .push({
        name: 'pushtest'
      })
      .then(() => {
        let list = testDb.getList('test');
        let id = mockDeepstream.lastUid - 1;
        let data = testDb.get(`test/${id}`);

        expect(data.name).toEqual('pushtest');
        expect(list.indexOf(`test/${id}`)).toBeGreaterThan(-1);

        done();
      })
      .catch(done.fail);

  });

  it('should throw error when push failed', (done) => {
    mockDeepstream.lastUid = 999;
    record
      .list('test')
      .push({
        name: 'test-push-fail'
      })
      .then(() => done.fail(new Error('Not failed!')))
      .catch((err: Error) => {
        let testRecord = testDb.get('test/999');
        let list = testDb.getList('test');
        expect(err.message).toEqual('Set failed');
        expect(testRecord).toBeUndefined();
        expect(list.indexOf('test/999')).toEqual(-1);
        done();
      });
  });  

});

