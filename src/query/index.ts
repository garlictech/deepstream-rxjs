import { Observable, Observer } from 'rxjs';
import { Client } from '../client';
import { Record } from '../record';
import { Logger } from '../logger';

export class Query {
  constructor(protected _client: Client) {}

  queryForEntries(queryOrHash: any): Observable<any> {
    let queryString = queryOrHash;
    if (typeof queryOrHash !== 'string') {
      queryString = JSON.stringify(queryOrHash);
    }
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

  queryForData(queryOrHash: any, table?: string): Observable<any> {
    return this.queryForEntries(queryOrHash).switchMap((recordNames: string[]) => {
      let recordObservables = recordNames.map(recordName => {
        let tableName = table || queryOrHash.table;
        let recordFQN = `${tableName}/${recordName}`;
        Logger.debug('theres a record' + recordFQN);
        let record = this._createRecord(recordFQN);
        return record.snapshot();
      });

      return Observable.combineLatest(recordObservables);
    });
  }

  pageableQuery(queryOrHash, start, end, table?): Observable<any> {
    return this.queryForEntries(queryOrHash).switchMap((recordNames: string[]) => {
      let records = recordNames.slice(start, end);
      let recordObservables = records.map(recordName => {
        let tableName = table || queryOrHash.table;
        let recordFQN = `${tableName}/${recordName}`;
        let record = this._createRecord(recordFQN);
        return record.snapshot();
      });

      return Observable.combineLatest(recordObservables);
    });
  }
  protected _createRecord(recordName: string): Record {
    return new Record(this._client, recordName);
  }
}
