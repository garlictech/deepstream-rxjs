import { Observable, Observer } from 'rxjs';
import { Client } from '../client';
import { Logger } from '../logger';

export class Event<T = any> {
  constructor(private _client: Client, private _topic: string) {
    /* EMPTY */
  }

  public receive(): Observable<T> {
    return Observable.create(observer => {
      this._client.client.event.subscribe(this._topic, observer.next);
      return () => this._client.client.event.unsubscribe(this._topic);
    });
  }

  public emit(data: T) {
    this._client.client.event.emit(this._topic, data);
  }
}
