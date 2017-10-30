import { Observable } from 'rxjs';
import * as _ from 'lodash';

import { Query } from '..';
import { Client } from '../../client';
import { Record } from '../../record';
import { List } from '../../list';
import { EventEmitter } from 'events';

describe('Test Query', () => {
  let getListSpy: jasmine.Spy;
  let snapshotSpy: jasmine.Spy;
  let subscribeSpy: jasmine.Spy;

  let data = ['data1', 'data2'];
  let data2 = ['data3', 'data4'];
  let allData = [data, data2];
  let tableName = 'tableName';
  let recordNames = ['record1', 'record2'];

  class MockClient extends Client {}

  class MockRecord extends Record<string> {
    static getSpy;
    constructor(_client, recordName) {
      super(_client, recordName);
      MockRecord.getSpy = jasmine.createSpy('get').and.returnValue(Observable.of('value'));
      this.get = MockRecord.getSpy;
    }
  }

  class MockRecordAny extends Record {
    static getSpy;
    constructor(_client, recordName) {
      super(_client, recordName);
      MockRecord.getSpy = jasmine.createSpy('get').and.returnValue(Observable.of('value'));
      this.get = MockRecord.getSpy;
    }
  }

  class MockQuery extends Query<string> {
    _createRecord(recordName) {
      return new MockRecord(this._client, recordName);
    }
  }

  class MockQueryAny extends Query {
    _createRecord(recordName) {
      return new MockRecordAny(this._client, recordName);
    }
  }

  beforeEach(() => {
    subscribeSpy = jasmine.createSpy('subscribe').and.callFake(callback => {
      callback(recordNames);
    });

    snapshotSpy = jasmine
      .createSpy('snapshot')
      .and.callFake((name, callback) => callback(null, _.flatten(allData)[snapshotSpy.calls.count() - 1]));

    getListSpy = jasmine.createSpy('getList').and.callFake(name => {
      return {
        whenReady: callback => callback(),
        subscribe: subscribeSpy,
        unsubscribe: () => {
          // Empty
        },
        delete: () => {
          // Empty
        }
      };
    });

    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return {
        deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
          record: {
            getList: getListSpy,
            snapshot: snapshotSpy
          },
          on: () => {
            /* EMPTY */
          }
        })
      };
    });
  });

  describe('When we try get only the entries with the query', () => {
    it('should return an observable', async () => {
      let client = new MockClient('atyala');
      let query = new Query(client);

      let queryObject = {
        tableName: tableName,
        query: [['title', 'match', 'test']]
      };

      let query$ = query.queryForEntries(queryObject);

      expect(query$ instanceof Observable).toBeTruthy();

      let result = await query$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      let queryString = JSON.stringify(queryObject);

      expect(args[0]).toEqual(`search?${queryString}`);
      expect(result instanceof Array).toBeTruthy();
      expect(result).toEqual(recordNames);
    });
  });

  describe('When we try get the data with the query', () => {
    it('should return an observable', async () => {
      let client = new MockClient('atyala');
      let query = new MockQuery(client);

      let queryObject = {
        tableName: tableName,
        query: [['title', 'match', 'test']]
      };

      let query$ = query.queryForData(queryObject);

      expect(query$ instanceof Observable).toBeTruthy();

      let result = await query$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      let queryString = JSON.stringify(queryObject);

      expect(args[0]).toEqual(`search?${queryString}`);
      expect(result instanceof Array).toBeTruthy();
      expect(result).toEqual(['value', 'value']);

      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[0] instanceof Function).toBeTruthy();
      expect(argsSubscribe[1]).toBeTruthy();

      // Just check if we can get the next data
      result = await query$.take(1).toPromise();
      expect(result).toEqual(['value', 'value']);
    });

    it('should work without type definition', async () => {
      let client = new MockClient('atyala');
      let query = new MockQueryAny(client);

      let queryObject = {
        tableName: tableName,
        query: [['title', 'match', 'test']]
      };

      let query$ = query.queryForData(queryObject);

      expect(query$ instanceof Observable).toBeTruthy();

      let result = await query$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      let queryString = JSON.stringify(queryObject);

      expect(args[0]).toEqual(`search?${queryString}`);
      expect(result instanceof Array).toBeTruthy();
      expect(result).toEqual(['value', 'value']);

      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[0] instanceof Function).toBeTruthy();
      expect(argsSubscribe[1]).toBeTruthy();

      // Just check if we can get the next data
      result = await query$.take(1).toPromise();
      expect(result).toEqual(['value', 'value']);
    });
  });

  describe('When we try to get a page of data with the query', () => {
    it('should return an observable', async () => {
      let client = new MockClient('atyala');
      let query = new MockQuery(client);

      let queryObject = {
        tableName: tableName,
        query: [['title', 'match', 'test']]
      };

      let query$ = query.pageableQuery(queryObject, 1, 2);

      expect(query$ instanceof Observable).toBeTruthy();

      let result = await query$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      let queryString = JSON.stringify(queryObject);

      expect(args[0]).toEqual(`search?${queryString}`);
      expect(result instanceof Array).toBeTruthy();
      expect(result).toEqual(['value']);

      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[0] instanceof Function).toBeTruthy();
      expect(argsSubscribe[1]).toBeTruthy();

      // Just check if we can get the next data
      result = await query$.take(1).toPromise();
      expect(result).toEqual(['value']);
    });
  });

  describe('When data changed', () => {
    it("should call observer's next", done => {
      getListSpy = jasmine.createSpy('getList').and.callFake(name => {
        return {
          whenReady: callback => callback(),
          subscribe: callback => {
            callback(data);

            setTimeout(() => {
              callback(data2);
            }, 100);
          },
          unsubscribe: () => {
            /* Empty */
          }
        };
      });

      let client = new MockClient('atyala');
      let query = new Query(client);

      let query$ = query.queryForEntries({
        tableName: tableName,
        query: [['title', 'match', 'test']]
      });

      expect(query$ instanceof Observable).toBeTruthy();

      query$.skip(1).subscribe(result => {
        expect(result instanceof Array).toBeTruthy();
        expect(result).toEqual(data2);
        done();
      }, done.fail);
    });
  });

  it('Test the dependency creator functions', () => {
    class MockQueryForCoverage extends Query<string> {
      public record;
      public createDependencyInstances() {
        this.record = this._createRecord('name');
      }
    }

    let list = new MockQueryForCoverage(null);
    list.createDependencyInstances();
    expect(list.record instanceof Record).toBeTruthy();
  });

  describe('When the query has an error', () => {
    let deleteSpy = jasmine.createSpy('delete');
    class MockDeepstream extends EventEmitter {
      record = {
        getRecord: jasmine.createSpy('getRecord').and.callFake(record => {
          return {
            discard: jasmine.createSpy('discard'),
            subscribe: (path, callback) => {
              callback(data);
            }
          };
        }),
        getList: jasmine.createSpy('getList').and.callFake(name => {
          return {
            delete: deleteSpy,
            subscribe: callback => {
              callback(data);
            }
          };
        }),
        subscribe: jasmine.createSpy('subscribeSpy')
      };
      removeEventListener = jasmine.createSpy('removeEventListener');
    }

    it('it should pass the error to the rxjs observable', done => {
      class MockEventClient extends Client {
        public client = new MockDeepstream();
      }

      let mockClient = new MockEventClient('connstr');
      let query = new Query(mockClient);

      let query$ = query.queryForEntries({ tableName: tableName, query: [['title', 'match', 'test']] });
      let subs = query$.subscribe(
        () => {
          /* EMPTY */
        },
        err => {
          expect(err).toEqual('MESSAGE');
          subs.unsubscribe();
          expect(mockClient.client.removeEventListener).toHaveBeenCalledWith('error');
          expect(deleteSpy).toHaveBeenCalled();
          done();
        }
      );
      mockClient.client.emit('error', 'ERR', 'MESSAGE');
    });
  });
});
