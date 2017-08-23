import { Observable, Observer } from 'rxjs'
import { Client } from '../client'
import { Logger } from '../logger'

export class Record {
  constructor(private _client: Client, private _name: string) {}

  setData(data: any, path?: string): Observable<any> {
    return new Observable<any>((obs: Observer<any>) => {
      this._client.client.record.setData(this._name, path, data, (err) => {
        if (err) {
          throw(err)
        }
        obs.next({})
        obs.complete()
      })
    })
  }

  snapshot() {
    return new Observable<any>((obs: Observer<any>) => {
      this._client.client.record.snapshot(this._name, (err, result) => {
        if (err) {
          throw(err)
        }
        obs.next(result)
        obs.complete()
      })
    })
  }
}