import { Observable } from 'rxjs';
import * as _ from 'lodash';

import { Query } from '..';
import { Client } from '../../client';

describe('Test Query', () => {
  let getListSpy: jasmine.Spy;
  let snapshotSpy: jasmine.Spy;
  let subscribeSpy: jasmine.Spy;

  let data = ['data1', 'data2'];
  let data2 = ['data3', 'data4'];
  let allData = [data, data2];
  let tableName = 'tableName';
  let recordNames = ['record1', 'record2'];

  class MockClient extends Client {
    public client = {
      record: {
        getList: getListSpy,
        snapshot: snapshotSpy
      }
    };
  }

  beforeEach(() => {
    subscribeSpy = jasmine
      .createSpy('subscribe')
      .and
      .callFake(callback => {
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
      let query = new Query(client);

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
      expect(result).toEqual(data);

      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[0] instanceof Function).toBeTruthy();
      expect(argsSubscribe[1]).toBeTruthy();

      let snapshotArgs = snapshotSpy.calls.mostRecent().args;
      expect(snapshotArgs[0]).toEqual(recordNames[1]);
      // Just check if we can get the next data
      result = await query$.take(1).toPromise();
      expect(result).toEqual(data2);
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
          unsubscribe: () => { /* Empty */ }
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
});
