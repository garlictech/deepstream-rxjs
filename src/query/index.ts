import { Observable, Observer } from 'rxjs';
import { Client } from '../client';
import { Record } from '../record';
import { Logger } from '../logger';

export class Query<T = any> {
  constructor(protected _client: Client) {}

  queryForEntries(queryOrHash: any): Observable<string[]> {
    let queryString = queryOrHash;
    if (typeof queryOrHash !== 'string') {
      queryString = JSON.stringify(queryOrHash);
    }
    let name = `search?${queryString}`;
    let list = this._client.client.record.getList(name);

    let observable = new Observable<string[]>((obs: Observer<string[]>) => {
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

  queryForData(queryOrHash: any, table?: string): Observable<T[]> {
    return this.queryForEntries(queryOrHash).switchMap((recordNames: string[]) => {
      if (recordNames.length === 0) {
        return Observable.of([]);
      }
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

  pageableQuery(queryOrHash, start, end, table?): Observable<T[]> {
    return this.queryForEntries(queryOrHash).switchMap((recordNames: string[]) => {
      if (recordNames.length === 0) {
        return Observable.of([]);
      }
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
  protected _createRecord(recordName: string): Record<T> {
    return new Record<T>(this._client, recordName);
  }
}
