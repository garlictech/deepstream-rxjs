import { Observable, Observer } from 'rxjs'
import * as deepstream from 'deepstream.io-client-js'

import { Record } from '../record'
import { IProviderConnectionData} from '../interfaces'

export class Client {
  private _record: Record;
  public client: deepstreamIO.deepstreamQuarantine;
  
  public constructor(connectionString: string) {
    this.client = Client.GetDependencies().deepstream(connectionString)
  }
  
  public get record(): Record {
    if (!this._record) {
      this._record = new Record(this.client);
    }
    
    return this._record;
  }
  
  public login(data: IProviderConnectionData): Observable < any > {
    console.log(`Deepstream provider "${data.providerName || 'unknown'}" is logging in...`)
    this.client.login(data)

    let errObs = Observable.fromEvent(this.client, "error")
    .do(state => {
      console.log("Error happened: ", state)
    })
    .subscribe()

    return Observable.fromEvent(this.client, "connectionStateChanged")
    .do(state => console.log("Deepstream client connection state: ", state))
    .filter(state => state === 'OPEN')
    .do(() => errObs.unsubscribe())
  }

  static GetDependencies() {
    return {
      deepstream: deepstream
    }
  }
}
