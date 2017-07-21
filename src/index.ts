import { Record } from './record';

export class DeepstreamRxjs {
  private _record: Record;

  public constructor(connectionString: string) {
    this.ds = deepstream(connectionString);
  }

  public get record(): Record {
    if (!this._record) {
      this._record = new Record();
    }

    return this._record;
  }

  public login(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ds
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
