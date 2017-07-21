import { Record } from './record';
import * as deepstream from 'deepstream.io-client-js';

export class DeepstreamRxjs {
  private _record: Record;
  protected client: deepstreamIO.deepstreamQuarantine;

  public constructor(connectionString: string) {
    this.client = deepstream(connectionString);
  }

  public get record(): Record {
    if (!this._record) {
      this._record = new Record(this.client);
    }

    return this._record;
  }

  public login(data: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client
        .login(data, success => {
          if (success === true) {
            resolve();
          } else {
            reject(new Error('Login failed'));
          }
        });
    });
  }

}
