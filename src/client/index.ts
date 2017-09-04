import {Observable, Observer, Subject, Subscription} from 'rxjs';

let deepstream = require('deepstream.io-client-js');

import {Logger} from '../logger';
import {IProviderConnectionData, IConnectionData} from '../interfaces';

export interface IClientData {
  username: string
}

export interface ILoginData {
  success: boolean,
  clientData: IClientData
}

export class Client {
  public client;

  public states$: Subject<any>;
  public errors$: Subject<any>;
  private subscribtion: Subscription;
  private errorSubscribtion: Subscription;

  static GetDependencies() {
    return {
      deepstream: deepstream
    };
  }

  public constructor(private _connectionString: string) {
    this.states$ = new Subject<any>();
    this.errors$ = new Subject<Error>();
  }

  public login(authData: IProviderConnectionData | IConnectionData): Observable<IClientData> {
    let loginSubject = new Subject<IClientData>();

    if (this.client) {
      this.client.close();
    }

    if (this.subscribtion) {
      this.subscribtion.unsubscribe();
    }

    if (this.errorSubscribtion) {
      this.errorSubscribtion.unsubscribe();
    }

    Logger.debug('Deepstream client is logging in.');
    Logger.debug('Login data: ', JSON.stringify(authData, null, 2));
    this.client = Client.GetDependencies().deepstream(this._connectionString);

    this.client.login(authData, (success, data) => {
      if (success === true) {
        loginSubject.next(data);
      } else {
        loginSubject.error(new Error('Login Failed'));
      }

      loginSubject.complete();
    });

    this.errorSubscribtion = Observable.fromEvent(this.client, 'error')
      .do(state => {
        Logger.debug('Error happened: ', state);
      })
      .subscribe(state => this.errors$.next(state));

    this.subscribtion = Observable.fromEvent(this.client, 'connectionStateChanged')
      .do(state => Logger.debug('Deepstream client connection state: ', state))
      .subscribe(state => this.states$.next(state));

    return loginSubject;
  }

  public logout() {
    if (this.subscribtion) {
      this.subscribtion.unsubscribe();
    }

    if (this.errorSubscribtion) {
      this.errorSubscribtion.unsubscribe();
    }

    if (this.client) {
      let obs$ = Observable.create(observer => {
        this.client.on('connectionStateChanged', state => {
          if (state === 'CLOSED') {
            observer.next();
            observer.complete();
          }
        });
        this.client.close();
      }).do(() => Logger.debug(`Deepstream client is logged out`));

      return obs$;
    } else {
      return Observable.of({});
    }
  }

  public isConnected(): boolean {
    return this.client && this.client.getConnectionState() === deepstream.CONSTANTS.CONNECTION_STATE.OPEN;
  }
}
