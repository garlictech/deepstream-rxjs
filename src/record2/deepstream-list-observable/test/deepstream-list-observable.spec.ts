import { Observer } from 'rxjs';
import { DeepstreamListObservable } from '../';

describe('DeepstreamListObservable', () => {

  it('should throw error when created without a list', (done) => {
    let client = {
      getUid: () => {},
      getRecord: () => {
        return {};
      }
    };

    let observable = new DeepstreamListObservable<any>((obs: (Observer<any>)) => {
      return () => {}
    }, client);

    observable
      .push({
        test: 1
      })
      .then(() => done.fail(new Error('It has been called')))
      .catch((err: Error) => {
        expect(err.message).toEqual('Observable without list');
        done()
      });
  });

  it('should throw error when created without a client', (done) => {
    let list = {
      name: 'test',
      subscribe: () => {},
      unsubscribe: () => {},
      addEntry: () => {},
      whenReady: (callback) => {
        callback();
      }
    };    
    
    let observable = new DeepstreamListObservable<any>((obs: (Observer<any>)) => {
      return () => {}
    }, null, list);

    observable
      .push({
        test: 1
      })
      .then(() => done.fail(new Error('It has been called')))
      .catch((err: Error) => {
        expect(err.message).toEqual('Observable without deepstream client');
        done()
      });
  });  
});