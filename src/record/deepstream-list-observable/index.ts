import { 
  Observable,
  Subscriber,
  Subscription
} from 'rxjs';

export class DeepstreamListObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void, protected client?: deepstreamIO.deepstreamQuarantine, public list?: deepstreamIO.List) {
    super(subscribe);
  }

  push(value: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.list) {
        return reject(new Error('Observable without list'));
      }

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

  protected createRecord(path: string, value: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.client) {
        return reject(new Error('Observable without deepstream client'));
      }

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
