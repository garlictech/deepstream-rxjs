import { Observable, Observer } from 'rxjs';
import { Client } from '../client';
import { Logger } from '../logger';

export class Record {
  constructor(private _client: Client, private _name: string) {}

  public get(path?: string): Observable<any> {
    let record = this._client.client.record.getRecord(this._name);
    let observable = new Observable<any>((obs: Observer<any>) => {
      this._client.client.on('error', (err, msg) => {
        obs.error(msg);
      });
      record.subscribe(path, data => {
        obs.next(data);
      });

      return () => {
        this._client.client.removeEventListener('error');
        record.discard();
      };
    });

    return observable;
  }

  public set(value: any): Observable<void>;
  public set(field: string, value: any): Observable<void>;
  public set(fieldOrValue: any, value?: any): Observable<void> {
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
      let callback = exists => {
        obs.next(exists);
        obs.complete();
      };
      this._client.client.record.has(this._name, callback);
    });
  }

  public snapshot() {
    return this.get().take(1);
  }
}
