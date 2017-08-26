import {Observable} from 'rxjs';

import {Query} from '..';
import {Client} from '../../client';

describe('Test Query', () => {
  let getListSpy: any;

  let data = ['1', '2'];
  let data2 = ['1', '2', '3'];

  class MockClient extends Client {
    public client = {
      record: {
        getList: getListSpy
      }
    };
  }

  describe('When we try to get the data', () => {
    it('should return an observable', async () => {
      getListSpy = jasmine.createSpy('getList').and.callFake(name => {
        return {
          whenReady: callback => callback(),
          subscribe: callback => {
            callback(data);
          },
          unsubscribe: () => {},
          delete: () => {}
        };
      });

      let client = new MockClient('atyala');
      let query = new Query(client);

      let queryObject = {
        tableName: 'test',
        query: [['title', 'match', 'test']]
      };

      let query$ = query.query(queryObject);

      expect(query$ instanceof Observable).toBeTruthy();

      let result = await query$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      let queryString = JSON.stringify(queryObject);

      expect(args[0]).toEqual(`search?${queryString}`);
      expect(result instanceof Array).toBeTruthy();
      expect(result).toEqual(data);
    });

    it("should call observer's next when data changed", done => {
      getListSpy = jasmine.createSpy('getList').and.callFake(name => {
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
      let query = new Query(client);

      let query$ = query.query({
        tableName: 'test',
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
