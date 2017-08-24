import {
  Observable,
  Subscription,
  Subscriber
} from 'rxjs';

export class DeepstreamRecordObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void, public record?) {
    super(subscribe);
  }

  set(value: any): Promise<void>;
  set(field: string, value: any): Promise<any>;
  set(fieldOrValue: any, value?: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.record) {
        return reject(new Error('Observable without record'));
      }

      this.record.whenReady(() => {
        let callback = (err) => {
          if (err) {
            return reject(err);
          }

          resolve();
        };

        if (typeof value === 'undefined') {
          this.record.set(fieldOrValue, callback);
        } else {
          this.record.set(fieldOrValue, value, callback); 
        }
      });
    });
  }

}
