import { Observable, Observer } from 'rxjs';
import { Client } from '../client';
import { Logger } from '../logger';
import { Record } from '../record';

export class List {
  private _list;

  constructor(private _client: Client, private _name: string) {
    this._list = this._client.client.record.getList(this._name);
  }

  subscribeForEntries(triggerNow: boolean = true): Observable<string[]> {
    let observable = new Observable<any>((obs: Observer<any>) => {
      this._list.subscribe(data => {
        obs.next(data);
      }, triggerNow);

      // return () => this._list.unsubscribe(unsubscribeCb);
    });

    return observable;
  }

  subscribeForData(triggerNow: boolean = true): Observable<any> {
    return this.subscribeForEntries(triggerNow).switchMap((recordNames: string[]) => {
      let recordObservables = recordNames.map(recordName => {
        let record = new Record(this._client, recordName);
        return record.snapshot();
      });
      return Observable.combineLatest(recordObservables);
    });
  }

  addEntry(entry: string, index?: number): void {
    this._list.addEntry(entry, index);
  }

  removeEntry(entry: string, index?: number): void {
    this._list.removeEntry(entry, index);
  }

  addRecord(data: any, index?: number): Observable<void> {
    let entryId = `${this._name}/${this._client.client.getUid()}`;
    this.addEntry(entryId, index);
    let record = new Record(this._client, entryId);
    return record.set(data);
  }

  discard() {
    this._list.discard();
  }
}
