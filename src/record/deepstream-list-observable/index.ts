import { Observable } from 'rxjs';

export class DeepstreamListObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void, protected client: any, public list: any) {
    super(subscribe);
  }

  push(value: any): Promise {
    return new Promise((resolve, reject) => {
      this.list.whenReady(() => {
        let id = `${this.list.name}/${this.client.getUid()}`;

        this
          .createRecord(id, value)
          .then(() => {
            this.list.addEntry(id);
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  }

  protected createRecord(path: string, value: any): Promise) {
    return new Promise((resolve, reject) => {
      let record = this.client.record.getRecord(path);

      record.whenReady(() => {
        record.set(value, err => {
          if (err) {
            reject(err);
          }

          resolve();
        });
      });
    });
  }

}
