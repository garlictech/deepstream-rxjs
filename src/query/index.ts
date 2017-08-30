import { Observable, Observer } from 'rxjs';
import { Client } from '../client';
import { Record } from '../record';
import { Logger } from '../logger';

export class Query {
  constructor(protected _client: Client) {}

  queryForEntries(query: any): Observable<any> {
    let queryString = JSON.stringify(query);
    let name = `search?${queryString}`;
    let list = this._client.client.record.getList(name);

    let observable = new Observable<any>((obs: Observer<any>) => {
      list.subscribe(data => {
        obs.next(data);
      }, true);

      return () => list.delete();
    });

    return observable;
  }

  queryForData(query: any): Observable<any> {
    return this.queryForEntries(query).switchMap((recordNames: string[]) => {
      let recordObservables = recordNames.map(recordName => {
        let record = this._createRecord(recordName);
        return record.get();
      });

      return Observable.combineLatest(recordObservables);
    });
  }
  protected _createRecord(recordName: string): Record {
    return new Record(this._client, recordName);
  }
}
