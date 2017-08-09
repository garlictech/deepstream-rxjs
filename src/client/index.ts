import { Observable, Observer } from 'rxjs'
let deepstream = require('deepstream.io-client-js')

import { Record } from '../record'
import { IProviderConnectionData, IConnectionData } from '../interfaces'

export class Client {
  public client
  private _record: Record

  static GetDependencies() {
    return {
      deepstream: deepstream
    }
  }

  public constructor(private _connectionString: string) {}

  public get record(): Record {
    if (!this._record) {
      this._record = new Record(this.client);
    }

    return this._record;
  }

  public login(authData: IProviderConnectionData | IConnectionData): Observable < any > {
    this.client = Client.GetDependencies().deepstream(this._connectionString)
    console.log("Deepstream client is logging in... with data: ", JSON.stringify(authData, null, 2))
    this.client.login(authData)

    let errObs = Observable.fromEvent(this.client, "error")
    .do(state => {
      console.log("Error happened: ", state)
    })
    .subscribe()

    return Observable.fromEvent(this.client, "connectionStateChanged")
    .do(state => console.log("Deepstream client connection state: ", state))
    .filter(state => state === 'OPEN')
    .take(1)
    .do(() => errObs.unsubscribe())
  }

  public logout() {
    if (this.client) {
      let obs$ = Observable.fromEvent(this.client, "connectionStateChanged")
      .do(state => console.log("Closing client connection state: ", state))
      .filter(state => state === 'CLOSED')
      .take(1)
      .do(() => console.log(`Deepstream client is logged out`))
      
      this.client.close()
      return obs$
    } else {
      return Observable.of({})
    }
  }

  public isConnected(): boolean {
    return this.client && this.client.getConnectionState() === deepstream.CONSTANTS.CONNECTION_STATE.OPEN
  }
}
