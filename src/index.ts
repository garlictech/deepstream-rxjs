import { Record } from './record';
import { Observable, Observer } from 'rxjs';
import * as deepstream from 'deepstream.io-client-js';

export class DeepstreamRxjs {
  private _record: Record;
  public client: deepstreamIO.deepstreamQuarantine;

  public constructor(connectionString: string) {
    this.client = deepstream(connectionString);
  }

  public get record(): Record {
    if (!this._record) {
      this._record = new Record(this.client);
    }

    return this._record;
  }

  public login(data: any): Observable<void> {
    return Observable
      .create((observer: Observer<void>) => {
        this.client
          .login(data, success => {
            if (success === true) {
              observer.next(data);
              observer.complete();
            } else {
              observer.error(new Error('Login failed'));
            }
          });
      });
  }

}
