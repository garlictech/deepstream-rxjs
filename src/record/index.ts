import { Observable, Observer } from 'rxjs';

import { DeepstreamListObservable } from './deepstream-list-observable';
import { DeepstreamRecordObservable } from './deepstream-record-observable';

export class Record {
  public constructor(private client: deepstreamIO.deepstreamQuarantine) {}

  public list(path: string): DeepstreamListObservable<DeepstreamRecordObservable<any>[]> {
    let list = this.client.record.getList(path);
    let isQuery = path.indexOf('search?') !== -1;
    let listName;

    if (isQuery) {
      let queryString = path.split('search?')[1];
      let parsed = JSON.parse(queryString);
      listName = parsed.table;
    }
    
    let observable = DeepstreamListObservable.create((obs: Observer<DeepstreamRecordObservable<any>[]>) => {
      list.subscribe((paths) => {
        let records = paths.map((path) => {
          let recordPath = isQuery ? `${listName}/${path}` : path;
          return this.record(recordPath);
        });
        
        obs.next(records);
      }, true);

      return () => list.unsubscribe();
    }, this.client, list);

    return observable;
  }

  public record(path: string): DeepstreamRecordObservable<any> {
    let record = this.client.record.getRecord(path);
    
    let observable = DeepstreamRecordObservable.create((obs: Observer<any>) => {
      record.subscribe((data) => {
        obs.next(data);
      }, true);

      return () => record.unsubscribe();
    }, record);

    return observable;
  }  
};
