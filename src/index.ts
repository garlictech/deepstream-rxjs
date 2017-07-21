import { Record } from './record';

declare var deepstream:any;

export class DeepstreamRxjs {
  private _record: Record;
  protected ds: any;

  public constructor(connectionString: string) {
    this.ds = deepstream(connectionString);
  }

  public get record(): Record {
    if (!this._record) {
      this._record = new Record(this.ds);
    }

    return this._record;
  }

  public login(data: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
