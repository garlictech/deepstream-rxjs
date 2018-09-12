import { Observable, Subject, Subscription, fromEvent, of } from 'rxjs';
import { tap } from 'rxjs/operators';

let deepstream = require('deepstream.io-client-js'); // tslint:disable-line:no-var-requires

import { Logger } from '../logger';
import { IProviderConnectionData, IConnectionData } from '../interfaces';

export interface IClientData {
  id: string;
  roles?: string[];
  permissionRecord?: string;
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

  public constructor(private _connectionString: string, options?: any) {
    this.states$ = new Subject<any>();
    this.errors$ = new Subject<Error>();
    this.client = Client.GetDependencies().deepstream(this._connectionString, options);
  }

  public login(authData: IProviderConnectionData | IConnectionData): Observable<IClientData> {
    let loginSubject = new Subject<IClientData>();

    Logger.debug('Deepstream client is logging in.');
    Logger.debug('Login data: ', JSON.stringify(authData, null, 2));
    this.client.login(authData, (success, data) => {
      if (success === true) {
        // Return the clientData
        loginSubject.next(data);
        loginSubject.complete();
      } else {
        // Close the connection if error happened
        this.close().subscribe(() => {
          loginSubject.error(new Error('Login Failed'));
        }, loginSubject.error);
      }
    });

    // Create the subscribtions
    this.errorSubscribtion = fromEvent(this.client, 'error')
      .pipe(
        tap(state => {
          Logger.debug('Error happened: ');
          Logger.debug(JSON.stringify(state, null, 2));
        })
      )
      .subscribe(state => this.errors$.next(state));

    this.subscribtion = fromEvent(this.client, 'connectionStateChanged')
      .pipe(tap(state => Logger.debug('Deepstream client connection state: ', state)))
      .subscribe(state => this.states$.next(state));

    return loginSubject;
  }

  public close(): Observable<void> {
    // Unsubscribe from the active subscribtions
    if (this.subscribtion) {
      this.subscribtion.unsubscribe();
    }

    if (this.errorSubscribtion) {
      this.errorSubscribtion.unsubscribe();
    }

    // Call the native close event
    if (this.client && this.isClosed() !== true) {
      let obs$ = new Observable<void>(observer => {
        this.client.on('connectionStateChanged', state => {
          if (state === 'CLOSED') {
            observer.next();
            observer.complete();
          }
        });
        this.client.close();
      }).pipe(tap(() => Logger.debug(`Deepstream client is closed`)));

      return obs$;
    } else {
      return of(undefined);
    }
  }

  public isClosed(): boolean {
    return this.client && this.client.getConnectionState() === deepstream.CONSTANTS.CONNECTION_STATE.CLOSED;
  }

  public isConnected(): boolean {
    return this.client && this.client.getConnectionState() === deepstream.CONSTANTS.CONNECTION_STATE.OPEN;
  }
}
