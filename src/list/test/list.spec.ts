import { Observable } from 'rxjs';
import * as _ from 'lodash';
import * as uuid from 'uuid/v1';
import { EventEmitter } from 'events';

import { List } from '..';
import { Client } from '../../client';
import { Record } from '../../record';

describe('Test List', () => {
  let addEntrySpy: jasmine.Spy;
  let removeEntrySpy: jasmine.Spy;
  let getListSpy: jasmine.Spy;
  let subscribeSpy: jasmine.Spy;
  let isEmptySpy = jasmine.createSpy('isEmpty').and.returnValue(false);
  let client;
  let snapshotSpy: jasmine.Spy;
  let setDataSpy: jasmine.Spy;
  let listName = 'listName';
  let getRecordSpy: jasmine.Spy;
  let discardSpy: jasmine.Spy;
  let listOffSpy: jasmine.Spy;
  let listOnSpy: jasmine.Spy;

  let data = ['data1', 'data2'];
  let data2 = ['data3', 'data4'];
  let allData = [data, data2];
  let generatedUid = uuid();
  // The getListSpy.addEntry uses it
  let internalList;
  let recordNames = ['record1', 'record2'];
  let rawList: MockRawList;

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

  class MockList extends List<string> {
    public _createRecord(recordName) {
      return new MockRecord(this._client, recordName);
    }
  }

  class MockListAny extends List {
    public _createRecord(recordName) {
      return new MockRecordAny(this._client, recordName);
    }
  }

  class MockRawList extends EventEmitter {
    // constructor() {
    //   super();
    //   this.on = listOnSpy;
    // }
    whenReady = callback => setTimeout(() => callback(rawList), 100);
    subscribe = subscribeSpy;
    isEmpty = isEmptySpy;
    unsubscribe() {
      /* EMPTY */
    }
    addEntry = addEntrySpy;
    removeEntry = removeEntrySpy;
    discard = discardSpy;
    off = listOffSpy;
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
    listOffSpy = jasmine.createSpy('listOffSpy');
    listOnSpy = jasmine.createSpy('listOnSpy');

    getListSpy = jasmine.createSpy('getList').and.callFake(name => {
      rawList = new MockRawList();
      return rawList;
    });
    internalList = [];

    class MockRawDeepstream extends EventEmitter {
      record = { getList: getListSpy, snapshot: snapshotSpy, setData: setDataSpy, getRecord: getRecordSpy };
      getUid = () => generatedUid;
    }

    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return {
        deepstream: jasmine.createSpy('deepstreamStub').and.returnValue(new MockRawDeepstream())
      };
    });

    client = new MockClient('atyala');
  });

  describe('When we try to get the data as stream of entries', () => {
    it('should return an observable', async () => {
      let list = new MockList(client, listName);
      let list$ = list.subscribeForEntries();
      expect(list$ instanceof Observable).toBeTruthy();

      let result = await list$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      expect(args[0]).toEqual(listName);
      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[1]).toBeTruthy();
    });

    it('should work without type definition', async () => {
      let list = new MockListAny(client, listName);
      let list$ = list.subscribeForEntries();
      expect(list$ instanceof Observable).toBeTruthy();

      let result = await list$.take(1).toPromise();
      let args = getListSpy.calls.mostRecent().args;

      expect(args[0]).toEqual(listName);
      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[1]).toBeTruthy();
    });
  });

  describe('When we try to get the data as stream of data objects', () => {
    it('should return an observable', async () => {
      let list = new MockList(client, listName);
      let list$ = list.subscribeForData();
      expect(list$ instanceof Observable).toBeTruthy();

      let result = await list$.take(1).toPromise();
      expect(result).toEqual(['value', 'value']);
      let args = getListSpy.calls.mostRecent().args;
      expect(args[0]).toEqual(listName);

      let argsSubscribe = subscribeSpy.calls.mostRecent().args;
      expect(subscribeSpy).toHaveBeenCalled();
      expect(argsSubscribe[0] instanceof Function).toBeTruthy();
      expect(argsSubscribe[1]).toBeTruthy();
    });

    describe('When the list on deepstream is empty', () => {
      it('should return an empty list', async () => {
        let list = new MockList(client, listName);
        spyOn(list, 'subscribeForEntries').and.returnValue(Observable.of([]));
        let list$ = list.subscribeForData();
        let result = await list$.take(1).toPromise();
        expect(result).toEqual([]);
      });
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
            },
            on: () => {
              /* EMPTY */
            },
            isEmpty: () => {
              return false;
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

  it('Test the dependency creator functions', () => {
    class MockListForCoverage extends List<string> {
      public record;
      public createDependencyInstances() {
        this.record = this._createRecord('name');
      }
    }

    let list = new MockListForCoverage(client, 'listname');
    list.createDependencyInstances();
    expect(list.record instanceof Record).toBeTruthy();
  });

  describe('When subscribing for the "entry-added" event by recordAdded', () => {
    it('should return the new entry', done => {
      const position = 898;
      const entryName = 'entryName';
      let list = new MockList(client, listName);
      spyOn(list, '_createRecord').and.callThrough();

      let subscription = list.recordAdded().subscribe(newRecord => {
        expect(newRecord).toEqual({ data: 'value', position: position });
        expect(list._createRecord).toHaveBeenCalledWith(entryName);
        subscription.unsubscribe();
        let args = listOffSpy.calls.mostRecent().args;
        expect(args[0]).toEqual('entry-added');
        expect(args[1] instanceof Function).toBeTruthy();
        done();
      });
      rawList.emit('entry-added', entryName, position);
    });
  });

  it('should throw error when a list operation fails', done => {
    let list = new MockList(client, listName);
    list.subscribeForEntries().subscribe(
      () => {
        /* EMPTY */
      },
      err => {
        expect('TESTERROR').toEqual(err);
        done();
      }
    );

    client.errors$.next('TESTERROR');
  });

  it('isEmpty should return true when the list is empty', async done => {
    let list = new MockList(client, listName);
    rawList.isEmpty = jasmine.createSpy('isEmpty').and.returnValue(true);
    let res$ = list.isEmpty().subscribe(res => {
      expect(res).toBeTruthy();
      expect(res$.closed);
      done();
    });
  });

  it('isEmpty should return false when the list is not empty', async done => {
    let list = new MockList(client, listName);
    rawList.isEmpty = jasmine.createSpy('isEmpty').and.returnValue(false);
    let res$ = list.isEmpty().subscribe(res => {
      expect(res).toBeFalsy();
      expect(res$.closed);
      done();
    });
  });
});
