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
      this._client.client.on('error', (err, msg) => {
        obs.error(msg);
      });
      list.subscribe(data => {
        obs.next(data);
      }, true);

      return () => {
        this._client.client.removeEventListener('error');
        list.delete();
      };
    });

    return observable;
  }

  queryForData(query: any): Observable<any> {
    return this.queryForEntries(query).switchMap((recordNames: string[]) => {
      let recordObservables = recordNames.map(recordName => {
        let recordFQN = `${query.table}/${recordName}`;
        let record = this._createRecord(recordFQN);
        return record.get();
      });

      return Observable.combineLatest(recordObservables);
    });
  }
  protected _createRecord(recordName: string): Record {
    return new Record(this._client, recordName);
  }
}
