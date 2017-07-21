import { Observable } from 'rxjs';

export class DeepstreamRecordObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void, public record: any) {
    super(subscribe);
  }

  set(value: any): Promise {
    return new Promise((resolve, reject) => {
      this.record.whenReady(() => {
        this.record.set(value, err => {
          if (err) {
            reject(err);
          }

          resolve();
        });
      });
    });
  }

}
