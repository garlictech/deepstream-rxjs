import { Observable, Observer, combineLatest, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
    let liveQueryName = `search?${queryString}`;
    let listName = `live_${queryString}`;
    let liveQuery = this._client.client.record.getList(liveQueryName);
    let list = this._client.client.record.getList(listName);

    let observable = new Observable<string[]>((obs: Observer<string[]>) => {
      this._client.client.on('error', (err, msg) => {
        obs.error(msg);
      });
      list.subscribe(data => {
        obs.next(data);
      });

      return () => {
        this._client.client.removeEventListener('error');
        list.discard();
      };
    });

    return observable;
  }

  queryForData(queryOrHash: any, table?: string): Observable<T[]> {
    return this.queryForEntries(queryOrHash).pipe(
      switchMap((recordNames: string[]) => {
        if (recordNames.length === 0) {
          return of([]);
        }
        let recordObservables = recordNames.map(recordName => {
          let tableName = table || queryOrHash.table;
          let recordFQN = `${tableName}/${recordName}`;
          Logger.debug('theres a record' + recordFQN);
          let record = this._createRecord(recordFQN);
          return record.snapshot();
        });

        return combineLatest(recordObservables);
      })
    );
  }

  pageableQuery(queryOrHash, start, end, table?): Observable<T[]> {
    return this.queryForEntries(queryOrHash).pipe(
      switchMap((recordNames: string[]) => {
        if (recordNames.length === 0) {
          return of([]);
        }
        let records = recordNames.slice(start, end);
        let recordObservables = records.map(recordName => {
          let tableName = table || queryOrHash.table;
          let recordFQN = `${tableName}/${recordName}`;
          let record = this._createRecord(recordFQN);
          return record.snapshot();
        });

        return combineLatest(recordObservables);
      })
    );
  }

  protected _createRecord(recordName: string): Record<T> {
    return new Record<T>(this._client, recordName);
  }
}
