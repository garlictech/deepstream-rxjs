import { Observable, Observer } from 'rxjs';
import { Client } from '../client';
import { Logger } from '../logger';

export class Record {
  constructor(private _client: Client, private _name: string) {}

  public setData(data: any, path?: string): Observable<any> {
    return new Observable<any>((obs: Observer<any>) => {
      this._client.client.record.setData(this._name, path, data, err => {
        if (err) {
          obs.error(err);
        }
        obs.next({});
        obs.complete();
      });
    });
  }

  public snapshot() {
    return new Observable<any>((obs: Observer<any>) => {
      this._client.client.record.snapshot(this._name, (err, result) => {
        if (err) {
          obs.error(err);
        }
        obs.next(result);
        obs.complete();
      });
    });
  }
}
