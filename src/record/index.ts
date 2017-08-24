import { Observable, Observer } from 'rxjs';

import { DeepstreamListObservable } from './deepstream-list-observable';
import { DeepstreamRecordObservable } from './deepstream-record-observable';

export class Record {
  public constructor(private client) {}

  public list(path: string): DeepstreamListObservable<DeepstreamRecordObservable<any>[]> {
    let list = this.client.record.getList(path);
    let isQuery = path.indexOf('search?') !== -1;
    let listName;

    if (isQuery) {
      let queryString = path.split('search?')[1];
      let parsed = JSON.parse(queryString);
      listName = parsed.table;
    }

    let observable = new DeepstreamListObservable<any>((obs: (Observer<any>)) => {
      list.subscribe((paths) => {
        let records = paths.map((p) => {
          let recordPath = isQuery ? `${listName}/${p}` : p;
          return this.record(recordPath);
        });

        obs.next(records);
      }, true);

      return () => {
        if (isQuery) {
          // Queries need to be deleted
          list.delete();
        } else {
          // Normal deepstream lists just need to be unsubscribed from
          list.unsubscribe();
        }
      }
    }, this.client, list);

    return observable;
  }

  public record(path: string): DeepstreamRecordObservable<any> {
    let record = this.client.record.getRecord(path);

    let observable = new DeepstreamRecordObservable<any>((obs: Observer<any>) => {
      record.subscribe((data) => {
        obs.next(data);
      }, true);

      return () => record.unsubscribe();
    }, record);

    return observable;
  }
};
