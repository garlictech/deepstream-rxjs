import { Observable, Observer } from 'rxjs'
import * as util from 'util'
import { Client } from "../client"

export class Rpc {
  constructor(private _client: Client) {}

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
  }
}
