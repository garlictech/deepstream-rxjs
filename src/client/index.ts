import { Observable, Observer } from 'rxjs'
let deepstream = require('deepstream.io-client-js')

import { Logger } from '../logger'
import { IProviderConnectionData, IConnectionData } from '../interfaces'

export class Client {
  public client

  static GetDependencies() {
    return {
      deepstream: deepstream
    }
  }

  public constructor(private _connectionString: string) {}

  public login(authData: IProviderConnectionData | IConnectionData): Observable < any > {
    if (this.client) {
      this.client.close()
    }
    Logger.debug("Deepstream client is logging in.")
    Logger.debug("Login data: ", JSON.stringify(authData, null, 2))
    this.client = Client.GetDependencies().deepstream(this._connectionString)
    this.client.login(authData)

    let errObs = Observable.fromEvent(this.client, "error")
    .do(state => {
      Logger.debug("Error happened: ", state)
    })
    .subscribe()

    return Observable.fromEvent(this.client, "connectionStateChanged")
    .do(state => Logger.debug("Deepstream client connection state: ", state))
    .filter(state => state === 'OPEN')
    .take(1)
    .do(() => errObs.unsubscribe())
  }

  public logout() {
    if (this.client) {
      let obs$ = Observable.create(observer => {
        this.client.on("connectionStateChanged", state => {
          if (state === 'CLOSED') {
            observer.next()
            observer.complete()
          }
        })
        this.client.close()
      }) 
      .do(() => Logger.debug(`Deepstream client is logged out`))

      return obs$
    } else {
      return Observable.of({})
    }
  }

  public isConnected(): boolean {
    return this.client && this.client.getConnectionState() === deepstream.CONSTANTS.CONNECTION_STATE.OPEN
  }
}
