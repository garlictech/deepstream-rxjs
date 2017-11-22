import { Observable, Observer, Subject } from 'rxjs';
import { Client } from '../client';
import { Logger } from '../logger';

export class Record<T = any> {
  constructor(private _client: Client, private _name: string) {}

  public get(path?: string): Observable<T> {
    let record = this._client.client.record.getRecord(this._name);
    let observable = new Observable<T>((obs: Observer<T>) => {
      let errHandler = (err, msg) => obs.error(msg);
      this._client.client.on('error', errHandler);

      let statusChanged = data => {
        obs.next(<T>data);
      };

      record.subscribe(path, statusChanged, true);

      return () => {
        this._client.client.off('error', errHandler);
        record.unsubscribe(this._name, statusChanged);
      };
    });

    return observable;
  }

  public set(value: T): Observable<void>;
  public set(field: string, value: any): Observable<void>;
  public set(fieldOrValue: string | T, value?: any): Observable<void> {
    return new Observable<void>((obs: Observer<void>) => {
      let callback = err => {
        if (err) {
          obs.error(err);
        }

        obs.next(null);
        obs.complete();
      };
      if (typeof value === 'undefined') {
        this._client.client.record.setData(this._name, fieldOrValue, callback);
      } else {
        this._client.client.record.setData(this._name, fieldOrValue, value, callback);
      }
    });
  }

  public exists(): Observable<boolean> {
    return new Observable<boolean>((obs: Observer<boolean>) => {
      let callback = (err, exists) => {
        obs.next(exists);
        if (err) {
          obs.error(err);
        }

        obs.complete();
      };
      this._client.client.record.has(this._name, callback);
    });
  }

  public snapshot() {
    return this.get().take(1);
  }

  public remove(): Observable<boolean> {
    return new Observable<boolean>((obs: Observer<boolean>) => {
      let errSubscription$ = this._client.errors$.subscribe(error => obs.error(error));
      let record = this._client.client.record.getRecord(this._name);

      let cleanup = () => {
        errSubscription$.unsubscribe();
        record.off('error', errorCb);
        record.off('delete', deleteCb);
      };

      let deleteCb = record.on('delete', () => {
        obs.next(true);
        obs.complete();
      });

      let errorCb = record.on('error', err => obs.error(err));
      record.delete();

      return () => cleanup();
    });
  }
}
