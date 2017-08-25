import { Observable, Observer } from 'rxjs'
import { Client } from '../client'
import { Logger } from '../logger'

export class Query {
  constructor(private _client: Client) {}

  query(query: any): Observable<any> {
    let queryString = JSON.stringify(query);
    let name = `search?${queryString}`;
    
    let list = this._client.client.record.getList(name);
    
    let observable = new Observable<any>((obs: Observer<any>) => {
      list.subscribe((data) => {
        obs.next(data);
      }, true);

      return () => list.delete();
    });

    return observable;
  }
}
