import { Observable, Observer } from 'rxjs'
import { Client } from '../client'
import { Logger } from '../logger'

export class List {
  constructor(private _client: Client, private _name: string) {}

  get(): Observable<any> {
    let list = this._client.client.record.getList(this._name);
    
    let observable = new Observable<any>((obs: Observer<any>) => {
      list.subscribe((data) => {
        obs.next(data);
      }, true);

      return () => list.unsubscribe();
    });    

    return observable;
  }

  addEntry(entry: string, index?: number):  void {
    let list = this._client.client.record.getList(this._name);

    list.addEntry(entry, index);
  }

  removeEntry(entry: string, index?: number):  void {
    let list = this._client.client.record.getList(this._name);

    list.removeEntry(entry, index);
  }
}