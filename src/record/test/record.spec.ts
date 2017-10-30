import { Observable } from 'rxjs';

import { Record, IRecordData } from '..';
import { Client } from '../../client';
import { EventEmitter } from 'events';

interface TestData extends IRecordData {
  foo: string;
  name?: string;
};

describe('Test Record', () => {
  let setDataSpy: any;
  let snapshotSpy: any;
  let getRecordSpy: any;
  let hasSpy: any;
  let offSpy: jasmine.Spy;
  let deleteSpy;
  let recordId = '1';
  let recordName = `record/${recordId}`;

  let data: TestData = {
    foo: 'bar'
  };

  let data2: TestData = {
    foo: 'bar2'
  };

  class MockClient extends Client {}

  beforeEach(() => {
    offSpy = jasmine.createSpy('off');
    deleteSpy = jasmine.createSpy('delete');

    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return {
        deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
          record: {
            setData: setDataSpy,
            snapshot: snapshotSpy,
            getRecord: getRecordSpy,
            has: hasSpy,
            delete: deleteSpy
          },
          on: () => {
            /* EMPTY */
          },
          off: offSpy
        })
      };
    });
  });

  describe('When we try to get the data', () => {
    beforeEach(() => {
      getRecordSpy = jasmine.createSpy('getRecord').and.callFake(name => {
        return {
          whenReady: callback => callback(),
          subscribe: (path, callback) => {
            callback(data);
          },
          unsubscribe: () => {
            /* Empty */
          },
          discard: () => {
            /* Empty */
          }
        };
      });
    });

    it('it should return an observable', async () => {
      let client = new MockClient('atyala');
      let record = new Record<TestData>(client, recordName);

      let record$ = record.get();
      expect(record$ instanceof Observable).toBeTruthy();

      let result = await record$.take(1).toPromise();

      let args = getRecordSpy.calls.mostRecent().args;

      expect(args[0]).toEqual(recordName);
      expect(result instanceof Object).toBeTruthy();
      expect(result.foo).toEqual(data.foo);
      expect(result._name).toEqual(recordName);
      expect(result.id).toEqual(recordId);
      expect(offSpy).toHaveBeenCalled();
    });

    it('should work without type definitions', async () => {
      let client = new MockClient('atyala');
      let record = new Record(client, recordName);

      let record$ = record.get();
      expect(record$ instanceof Observable).toBeTruthy();

      let result = await record$.take(1).toPromise();

      let args = getRecordSpy.calls.mostRecent().args;

      expect(args[0]).toEqual(recordName);
      expect(result instanceof Object).toBeTruthy();
      expect(result.foo).toEqual(data.foo);
      expect(result._name).toEqual(recordName);
      expect(result.id).toEqual(recordId);
      expect(offSpy).toHaveBeenCalled();
    });

    it("should call observer's next when data changed", done => {
      getRecordSpy = jasmine.createSpy('getRecord').and.callFake(name => {
        return {
          whenReady: callback => callback(),
          subscribe: (path, callback) => {
            callback(data);

            setTimeout(() => {
              callback(data2);
            }, 100);
          },
          unsubscribe: () => {/* Empty */}
        };
      });

      let client = new MockClient('atyala');
      let record = new Record<TestData>(client, recordName);

      let record$ = record.get();
      expect(record$ instanceof Observable).toBeTruthy();

      record$.skip(1).subscribe(_record => {
        expect(_record instanceof Object).toBeTruthy();
        expect(_record.foo).toEqual('bar2');
        done();
      }, done.fail);
    });
  });

  describe('When we try to set any data', () => {
    it('should do it', async () => {
      setDataSpy = jasmine.createSpy('setData').and.callFake((name, pathOrData, ...rest) => {
        let cb = rest[rest.length - 1];
        cb();
      });

      let client = new MockClient('atyala');
      let record = new Record<TestData>(client, recordName);
      let result = await record.set(data).toPromise();
      let args = setDataSpy.calls.mostRecent().args;
      expect(args[0]).toEqual(recordName);
      expect(args[1]).toEqual(data);
    });

    it('should set only a property value', async () => {
      setDataSpy = jasmine.createSpy('setData').and.callFake((name, pathOrData, ...rest) => {
        let cb = rest[rest.length - 1];
        cb();
      });

      let client = new MockClient('atyala');
      let record = new Record<TestData>(client, recordName);
      let result = await record.set('name', 'test').toPromise();
      let args = setDataSpy.calls.mostRecent().args;

      expect(args[0]).toEqual(recordName);
      expect(args[1]).toEqual('name');
      expect(args[2]).toEqual('test');
    });
  });

  describe('When the callback returns error', () => {
    it('should throw error', async done => {
      setDataSpy = jasmine.createSpy('setData').and.callFake((name, path, ...rest) => {
        let cb = rest[rest.length - 1];
        cb('error');
      });

      let client = new MockClient('atyala');
      let record = new Record<TestData>(client, recordName);

      await record.set(data).toPromise().catch(err => {
        expect(err).toEqual('error');
        done();
      });
    });
  });

  describe('When we try to get the snapshot of any data', () => {
    it('should do return', async () => {
      snapshotSpy = jasmine.createSpy('snapshot').and.callFake((name, cb) => {
        cb(null, data);
      });

      let client = new MockClient('atyala');
      let record = new Record<TestData>(client, recordName);
      spyOn(record, 'get').and.returnValue(Observable.of({}));
      let result = await record.snapshot().toPromise();
      expect(record.get).toHaveBeenCalled();
    });
  });

  describe('When the record subscription has error', () => {
    let discardSpy = jasmine.createSpy('discard');
    let unsubscribeSpy = jasmine.createSpy('unsubscribe');
    class MockDeepstream extends EventEmitter {
      record = {
        getRecord: jasmine.createSpy('getRecord').and.callFake(name => {
          return {
            discard: discardSpy,
            unsubscribe: unsubscribeSpy,
            subscribe: (path, callback) => {
              callback(data);
            }
          };
        }),
        subscribe: jasmine.createSpy('subscribeSpy')
      };
      off = offSpy;
    }

    beforeEach(() => {
      jasmine.clock().uninstall();
      jasmine.clock().install();
    });
    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('it should pass the error to the rxjs observable', done => {
      class MockEventClient extends Client {
        public client = new MockDeepstream();
      }

      let mockClient = new MockEventClient('connstr');
      let record = new Record<TestData>(mockClient, 'record');
      let subs = record.get().subscribe(
        () => {
          /* EMPTY */
        },
        err => {
          expect(err).toEqual('MESSAGE');
          expect(discardSpy).not.toHaveBeenCalled();
          subs.unsubscribe();
          expect(offSpy.calls.mostRecent().args[0]).toEqual('error');
          // This is for bug https://github.com/deepstreamIO/deepstream.io-client-js/issues/204
          jasmine.clock().tick(501);
          expect(discardSpy).toHaveBeenCalled();
          done();
        }
      );
      mockClient.client.emit('error', 'ERR', 'MESSAGE');
    });
  });

  describe('When we try to check if a record exists', () => {
    it('should invoke the has method on ds', async () => {
      hasSpy = jasmine.createSpy('has').and.callFake((name, cb) => cb(null, true));
      let mockClient = new MockClient('connstr');
      let record = new Record<TestData>(mockClient, 'existingRecord');
      let result = await record.exists().toPromise();
      expect(hasSpy).toHaveBeenCalledWith('existingRecord', jasmine.any(Function));
      expect(result).toBeTruthy();
    });
  });

  describe('When we try to check if a record exists', () => {
    it('should emit error if the operation errors', async done => {
      hasSpy = jasmine.createSpy('has').and.callFake((name, cb) => cb('ERROR', false));

      let mockClient = new MockClient('connstr');
      let record = new Record<TestData>(mockClient, 'existingRecord');
      let result = await record.exists().toPromise().catch(err => {
        expect('ERROR').toEqual(err);
        done();
      });
    });
  });

  describe('When removing an existing object', () => {
    let client;
    let unsubscribeSpy;
    let mockRecord;

    class MockRecord extends EventEmitter {
      constructor() {
        super();
      }

      delete = deleteSpy;
      off = offSpy;
    }

    beforeEach(() => {
      mockRecord = new MockRecord();
      getRecordSpy = jasmine.createSpy('getRecord').and.returnValue(mockRecord);
      client = new MockClient('connstr');
    });

    it('it should be ok', done => {
      unsubscribeSpy = { unsubscribe: jasmine.createSpy('unsubscribeSpy') };
      spyOn(client.errors$, 'subscribe').and.returnValue(unsubscribeSpy);
      let record = new Record<TestData>(client, 'record');
      let subs$ = record.remove().subscribe(res => {
        expect(res).toBeTruthy();
        expect(getRecordSpy).toHaveBeenCalled();
        expect(deleteSpy).toHaveBeenCalled();
        expect(client.errors$.subscribe).toHaveBeenCalled();
        // Wait for the unsubscription
        setTimeout(() => {
          expect(offSpy).toHaveBeenCalledTimes(2);
          expect(unsubscribeSpy.unsubscribe).toHaveBeenCalled();
          done();
        }, 10);
      });

      mockRecord.emit('delete');
    });

    it('should call the error handlers if there is any record error', done => {
      unsubscribeSpy = { unsubscribe: jasmine.createSpy('unsubscribeSpy') };
      spyOn(client.errors$, 'subscribe').and.returnValue(unsubscribeSpy);
      let record = new Record<TestData>(client, 'record');
      let subs$ = record.remove().subscribe(
        res => {
          /* EMPTY */
        },
        error => {
          expect(error).toEqual('ERROR');
          expect(getRecordSpy).toHaveBeenCalled();
          expect(deleteSpy).toHaveBeenCalled();
          expect(client.errors$.subscribe).toHaveBeenCalled();
          // Wait for the unsubscription
          setTimeout(() => {
            expect(offSpy).toHaveBeenCalledTimes(2);
            expect(unsubscribeSpy.unsubscribe).toHaveBeenCalled();
            done();
          }, 10);
        }
      );

      mockRecord.emit('error', 'ERROR');
    });

    it('should call the error handlers if there is any client error', done => {
      let record = new Record<TestData>(client, 'record');
      let subs$ = record.remove().subscribe(
        res => {
          /* EMPTY */
        },
        error => {
          expect(error).toEqual('ERROR');
          expect(getRecordSpy).toHaveBeenCalled();
          expect(deleteSpy).toHaveBeenCalled();
          // Wait for the unsubscription
          setTimeout(() => {
            expect(offSpy).toHaveBeenCalledTimes(2);
            expect(unsubscribeSpy.unsubscribe).toHaveBeenCalled();
            done();
          }, 10);
        }
      );

      client.errors$.next('ERROR');
    });
  });
});
