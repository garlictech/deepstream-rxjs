import { Observable, Observer } from 'rxjs';
import { Client } from '../client';
import { Record } from '../record';
import { Logger } from '../logger';

export class Query {
  constructor(private _client: Client) {}

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
        let record = new Record(this._client, `${query.table}/${recordName}`);
        return record.snapshot();
      });

      return Observable.combineLatest(recordObservables);
    });
  }
}
