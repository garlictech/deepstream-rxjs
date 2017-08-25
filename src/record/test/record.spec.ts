import { Observable } from 'rxjs';

import { Record } from '..';
import { Client } from '../../client';

describe('Test Record', () => {
  let setDataSpy: any;
  let snapshotSpy: any;
  let getRecordSpy: any;
  let recordName = 'recordName';

  let data = {
    foo: 'bar'
  };

  let data2 = {
    foo: 'bar2'
  };

  class MockClient extends Client {
    public client = {
      record: {
        setData: setDataSpy,
        snapshot: snapshotSpy,
        getRecord: getRecordSpy
      }
    };
  }

  describe('When we try to get the data', () => {
    it('should return an observable', async () => {
      getRecordSpy = jasmine.createSpy('getRecord').and.callFake(name => {
        return {
          whenReady: callback => callback(),
          subscribe: callback => {
            callback(data);
          },
          unsubscribe: () => {}
        };
      });

      let client = new MockClient('atyala');
      let record = new Record(client, recordName);

      let record$ = record.get();
      expect(record$ instanceof Observable).toBeTruthy();

      let result = await record$.take(1).toPromise();

      let args = getRecordSpy.calls.mostRecent().args;

      expect(args[0]).toEqual(recordName);
      expect(result instanceof Object).toBeTruthy();
      expect(result.foo).toEqual(data.foo);
    });

    it("should call observer's next when data changed", done => {
      getRecordSpy = jasmine.createSpy('getRecord').and.callFake(name => {
        return {
          whenReady: callback => callback(),
          subscribe: callback => {
            callback(data);

            setTimeout(() => {
              callback(data2);
            }, 100);
          },
          unsubscribe: () => {}
        };
      });

      let client = new MockClient('atyala');
      let record = new Record(client, recordName);

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
      let record = new Record(client, recordName);
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
      let record = new Record(client, recordName);
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
      let record = new Record(client, recordName);

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
      let record = new Record(client, recordName);
      let result = await record.snapshot().toPromise();
      let args = snapshotSpy.calls.mostRecent().args;
      expect(args[0]).toEqual(recordName);
      expect(result).toEqual(data);
    });
  });

  describe('When the snapshot returns error', () => {
    it('should throw error', async done => {
      snapshotSpy = jasmine.createSpy('snapshot').and.callFake((name, cb) => {
        cb('error', data);
      });

      let client = new MockClient('atyala');
      let record = new Record(client, recordName);

      await record.snapshot().toPromise().catch(err => {
        expect(err).toEqual('error');
        done();
      });
    });
  });
});
