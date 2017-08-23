import { Observer } from 'rxjs';
import { DeepstreamRecordObservable } from '../';

describe('DeepstreamRecordObservable', () => {

  it('should throw error when created without a record', (done) => {
    let observable = new DeepstreamRecordObservable<any>((obs: Observer<any>) => {
      return () => {};
    });

    observable
      .set('name', 'test')
      .then(() => done.fail(new Error('It has been called')))
      .catch((err: Error) => {
        expect(err.message).toEqual('Observable without record');
        done()
      });
  });
});