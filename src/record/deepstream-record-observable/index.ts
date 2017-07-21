import { 
  Observable,
  Subscription,
  Subscriber
} from 'rxjs';

export class DeepstreamRecordObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void, public record?: deepstreamIO.Record) {
    super(subscribe);
  }

  set(value: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.record) {
        return reject(new Error('Observable without record'));
      }
          
      this.record.whenReady(() => {
        this.record.set(value, err => {
          if (err) {
            return reject(err);
          }

          resolve();
        });
      });
    });
  }

}
