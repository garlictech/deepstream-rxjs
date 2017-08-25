<<<<<<< HEAD
import { Observable, Observer } from 'rxjs'
import * as util from 'util'
import { Client } from "../client"
=======
import { Observable, Observer } from 'rxjs';
import * as util from 'util';
import { Client } from '../client';
>>>>>>> 7ebd0ebaf0ab3bac1f09b68427438063db032d4d

export class Rpc {
  constructor(private _client: Client) {}

<<<<<<< HEAD
  make(name, data): Observable<any> {
    return new Observable<any>((obs: Observer<any>) => {
      this._client.client.rpc.make(name, data, (err, result) => {
        if (err) {
          throw(err)
        }
        obs.next(result)
        obs.complete()
      })
    })
  }

  provide(name, providerFv) {
    this._client.client.rpc.provide(name, providerFv)
=======
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
>>>>>>> 7ebd0ebaf0ab3bac1f09b68427438063db032d4d
  }
}
