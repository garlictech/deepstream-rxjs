import { Observable } from 'rxjs';
import * as _ from 'lodash';
import * as uuid from 'uuid/v1';

import { List } from '..';
import { Client } from '../../client';

describe('Test List', () => {
  let addEntrySpy: any;
  let removeEntrySpy: any;
  let getListSpy: any;
  let subscribeSpy;
  let client;
  let snapshotSpy;
  let setDataSpy;
  let listName = 'listName';
  let getRecordSpy;
  let discardSpy;

  let data = ['data1', 'data2'];
  let data2 = ['data3', 'data4'];
  let allData = [data, data2];
  let generatedUid = uuid();
  // The getListSpy.addEntry uses it
  let internalList;
  let recordNames = ['record1', 'record2'];

  class MockClient extends Client {
    public client = {
      record: { getList: getListSpy, snapshot: snapshotSpy, setData: setDataSpy, getRecord: getRecordSpy },
      getUid: () => generatedUid
    };
  }

  beforeEach(() => {
    subscribeSpy = jasmine.createSpy('subscribe').and.callFake(callback => {
      callback(recordNames);
    });

    setDataSpy = jasmine.createSpy('setDataSpy').and.callFake((name, value, callback) => {
      callback(null, null);
    });

    snapshotSpy = jasmine
      .createSpy('snapshot')
      .and.callFake((name, callback) => callback(null, _.flatten(allData)[snapshotSpy.calls.count() - 1]));

    addEntrySpy = jasmine.createSpy('addEntry');
    getRecordSpy = jasmine.createSpy('getRecordSpy');
    removeEntrySpy = jasmine.createSpy('removeEntry');
    discardSpy = jasmine.createSpy('discardSpy');

    getListSpy = jasmine.createSpy('getList').and.callFake(name => {
      return {
        whenReady: callback => callback(),
        subscribe: subscribeSpy,
        unsubscribe: () => {
          /* EMPTY */
        },
        addEntry: addEntrySpy,
        removeEntry: removeEntrySpy,
        discard: discardSpy
      };
    });
    client = new MockClient('atyala');
    internalList = [];
  });

  describe('When we try to get the data as stream of entries', () => {
    it('should return an observable', async () => {
      let list = new List(client, listName);
      let list$ = list.subscribeForEntries();
      expect(list$ instanceof Observable).toBeTruthy();

      let result = await list$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      expect(args[0]).toEqual(listName);
      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[1]).toBeTruthy();
    });

    it('should call the native subscribe with the provided triggerNow', async () => {
      let list = new List(client, listName);
      let list$ = list.subscribeForEntries(false);
      await list$.take(1).toPromise();
      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(argsSubscribe[1]).toBeFalsy();
    });
  });

  describe('When we try to get the data as stream of data objects', () => {
    it('should return an observable', async () => {
      let list = new List(client, listName);
      let list$ = list.subscribeForData();
      expect(list$ instanceof Observable).toBeTruthy();

      let result = await list$.take(1).toPromise();
      expect(result).toEqual(data);
      let args = getListSpy.calls.mostRecent().args;
      expect(args[0]).toEqual(listName);

      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[0] instanceof Function).toBeTruthy();
      expect(argsSubscribe[1]).toBeTruthy();

      let snapshotArgs = snapshotSpy.calls.mostRecent().args;
      expect(snapshotArgs[0]).toEqual(recordNames[1]);
      // Just check if we can get the next data
      result = await list$.take(1).toPromise();
      expect(result).toEqual(data2);
    });

    it('should call the native subscribe with the provided triggerNow', async () => {
      let list = new List(client, listName);
      let list$ = list.subscribeForData(false);
      await list$.take(1).toPromise();
      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(argsSubscribe[1]).toBeFalsy();
    });

    describe('When data changed', () => {
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
            unsubscribe: () => {
              /* EMPTY */
            }
          };
        });

        client = new MockClient('atyala');
        let list = new List(client, listName);
        let list$ = list.subscribeForEntries();
        expect(list$ instanceof Observable).toBeTruthy();

        list$.skip(1).subscribe(_list => {
          expect(_list).toEqual(data2);
          done();
        }, done.fail);
      });
    });
  });

  describe('When we try to add any data', () => {
    it('should do it', () => {
      let list = new List(client, listName);
      list.addEntry('5');
      let args = addEntrySpy.calls.mostRecent().args;
      expect(args[0]).toEqual('5');
    });
  });

  describe('When we try to remove any data', () => {
    it('should do it', () => {
      let list = new List(client, listName);
      list.removeEntry('5');

      let args = removeEntrySpy.calls.mostRecent().args;
      expect(args[0]).toEqual('5');
    });
  });

  describe('When adding data with addRecord', () => {
    let dataToAdd = { foo: 'bar' };
    let list;

    beforeEach(() => {
      list = new List(client, 'testList');
    });

    it('Should add an entry to the list and insert the data', async () => {
      await list.addRecord(dataToAdd).toPromise();
      expect(addEntrySpy).toHaveBeenCalledWith(`testList/${generatedUid}`, undefined);
      let args = setDataSpy.calls.mostRecent().args;
      expect(args[0]).toEqual(`testList/${generatedUid}`);
      expect(args[1]).toEqual(dataToAdd);
      expect(args[2] instanceof Function).toBeTruthy();
    });

    it('Should add an entry to the list and insert the data to the specified index if given', async () => {
      let index = 2;
      await list.addRecord(dataToAdd, index).toPromise();
      expect(addEntrySpy).toHaveBeenCalledWith(`testList/${generatedUid}`, index);
    });
  });

  describe('When calling discard', () => {
    it('should call the raw deepstream discard function', () => {
      let list = new List(client, 'testList');
      list.discard();
      expect(discardSpy).toHaveBeenCalled();
    });
  });
});
