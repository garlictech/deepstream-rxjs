import { Observable } from 'rxjs';

import { List } from '..';
import { Client } from '../../client';

describe('Test List', () => {
  let addEntrySpy: any;
  let removeEntrySpy: any;
  let getListSpy: any;
  let listName = 'listName';

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
          unsubscribe: () => {}
        };
      });

      let client = new MockClient('atyala');
      let list = new List(client, listName);

      let list$ = list.subscribeForEntries();
      expect(list$ instanceof Observable).toBeTruthy();

      let result = await list$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      expect(args[0]).toEqual(listName);
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
      let list = new List(client, listName);

      let list$ = list.subscribeForEntries();
      expect(list$ instanceof Observable).toBeTruthy();

      list$.skip(1).subscribe(list => {
        expect(list).toEqual(data2);
        done();
      }, done.fail);
    });
  });

  describe('When we try to add any data', () => {
    it('should do it', () => {
      addEntrySpy = jasmine.createSpy('addEntry');

      getListSpy = jasmine.createSpy('getList').and.callFake(name => {
        return {
          whenReady: callback => callback(),
          subscribe: callback => {
            callback(data);
          },
          addEntry: addEntrySpy,
          unsubscribe: () => {}
        };
      });

      let client = new MockClient('atyala');
      let list = new List(client, listName);

      list.addEntry('5');

      let args = addEntrySpy.calls.mostRecent().args;
      expect(args[0]).toEqual('5');
    });
  });

  describe('When we try to remove any data', () => {
    it('should do it', () => {
      removeEntrySpy = jasmine.createSpy('removeEntry');

      getListSpy = jasmine.createSpy('getList').and.callFake(name => {
        return {
          whenReady: callback => callback(),
          subscribe: callback => {
            callback(data);
          },
          removeEntry: removeEntrySpy,
          unsubscribe: () => {}
        };
      });

      let client = new MockClient('atyala');
      let list = new List(client, listName);

      list.removeEntry('5');

      let args = removeEntrySpy.calls.mostRecent().args;
      expect(args[0]).toEqual('5');
    });
  });
});
