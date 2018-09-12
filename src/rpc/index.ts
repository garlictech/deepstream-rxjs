import { Observable, Observer } from 'rxjs';
import { Client } from '../client';

export class Rpc {
  constructor(private _client: Client) {}

  public make(name, data): Observable<any> {
    return new Observable<any>((obs: Observer<any>) => {
      let errSubscription$ = this._client.errors$.subscribe(error => obs.error(error));

      this._client.client.rpc.make(name, data, (err, result) => {
        errSubscription$.unsubscribe();

        if (err) {
          try {
            obs.error(JSON.parse(err));
          } catch (e) {
            obs.error(err);
          }
        } else {
          obs.next(result);
          obs.complete();
        }
      });

      return () => {
        errSubscription$.unsubscribe();
      };
    });
  }

  public provide(name, providerFv) {
    this._client.client.rpc.provide(name, providerFv);
  }
}
