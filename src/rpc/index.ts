import {Observable, Observer} from 'rxjs';
import * as util from 'util';
import {Client} from '../client';

export class Rpc {
  constructor(private _client: Client) {}

  public make(name, data): Observable<any> {
    return new Observable<any>((obs: Observer<any>) => {
      this._client.client.rpc.make(name, data, (err, result) => {
        if (err) {
          try {
            obs.error(JSON.parse(err));
          } catch (e) {
            obs.error(err);
          }
        }
        obs.next(result);
        obs.complete();
      });
    });
  }

  public provide(name, providerFv) {
    this._client.client.rpc.provide(name, providerFv);
  }
}
