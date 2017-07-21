import { Observable, Observer } from 'rxjs';
import { DeepstreamListObservable } from './deepstream-list-observable';
import { DeepstreamRecordObservable } from './deepstream-record-observable';

export class Record {
  public constructor(private dsClient) {}

  public list(path: string): DeepstreamListObservable<any[]> {
    let list = this.dsClient.record.getList(path);
    
    let observable = DeepstreamListObservable.create((obs: Observer<any>) => {
      list.subscribe((entries) => {
        obs.next(entries);
      }, true);

      return () => list.unsubscribe();
    }, this.dsClient, list);

    return observable;
  }

  public record(path: string): DeepstreamRecordObservable<any> {
    let record = this.dsClient.record.getRecord(path);
    
    let observable = DeepstreamRecordObservable.create((obs: Observer<any>) => {
      record.subscribe((data) => {
        obs.next(data);
      }, true);

      return () => record.unsubscribe();
    }, record);

    return observable;
  }  
};
