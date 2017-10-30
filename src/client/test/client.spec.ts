import { EventEmitter } from 'events';
import sms = require('source-map-support');
sms.install();
let deepstream = require('deepstream.io-client-js');
import { Observable } from 'rxjs';
import { Client } from '..';
import { Record } from '../../record';

describe('When the deepstream client is up and running, the client', () => {
  let emitCloseEvent = false;

  class MockDeepstream extends EventEmitter {
    private _state = deepstream.CONSTANTS.CONNECTION_STATE.CLOSED;
    constructor() {
      super();
    }

    public login = jasmine.createSpy('login').and.callFake((authData, callback = (success, data) => {
      /* Empty */
    }) => {
      this._state = deepstream.CONSTANTS.CONNECTION_STATE.OPEN;

      this.on('connectionStateChanged', state => {
        switch (state) {
          case 'OPEN':
            callback(true, {
              id: 'foobar',
              roles: ['user']
            });
            break;

          case 'TESTFAIL':
            this._state = deepstream.CONSTANTS.CONNECTION_STATE.AWAITING_AUTHENTICATION;
            callback(false, null);
            break;
        }
      });
    });

    public close = jasmine.createSpy('close').and.callFake(() => {
      this._state = deepstream.CONSTANTS.CLOSED;
      if (emitCloseEvent === true) {
        this.emit('connectionStateChanged', 'CLOSED');
      }
    });

    public getConnectionState() {
      return this._state;
    }
  }

  let mockDeepstream: any;
  let deepstreamStub;
  let loginData = { providerName: 'UNIT TEST PROVIDER', jwtToken: 'foobar' };
  let connectionString = 'foobar';

  beforeEach(() => {
    emitCloseEvent = false;
    mockDeepstream = new MockDeepstream();

    deepstreamStub = jasmine.createSpy('deepstreamStub').and.callFake(() => {
      return mockDeepstream;
    });

    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return { deepstream: deepstreamStub };
    });
  });

  it('should connect', done => {
    let client = new Client(connectionString);
    expect(client.isConnected()).toBeFalsy();

    client.login(loginData).subscribe(loginResponse => {
      let args;

      expect(deepstreamStub).toHaveBeenCalledWith(connectionString);
      expect(Client.GetDependencies).toHaveBeenCalled();
      expect(mockDeepstream.login).toHaveBeenCalled();
      args = mockDeepstream.login.calls.mostRecent().args;
      expect(args[0]).toEqual(loginData);
      expect(loginResponse.id).toEqual('foobar');
      expect(client.isConnected()).toBeTruthy();
      done();
    }, done.fail);

    mockDeepstream.emit('connectionStateChanged', 'OPEN');
  });

  it('should subscribe to state changes', done => {
    let client = new Client(connectionString);

    client.login(loginData).subscribe(() => {
      // Do nothing
    }, done.fail);

    client.states$.subscribe(state => {
      expect(state).toEqual('TESTSTATE');
      done();
    });

    mockDeepstream.emit('connectionStateChanged', 'TESTSTATE');
  });

  it('should subscribe to errors', done => {
    let client = new Client(connectionString);

    client.login(loginData).subscribe(() => {
      // Do nothing
    }, done.fail);

    client.errors$.subscribe(state => {
      expect(state).toEqual('TESTERROR');
      done();
    });

    mockDeepstream.emit('error', 'TESTERROR');
  });

  it('should throw error when login fails', done => {
    let client = new Client(connectionString);
    expect(client.isConnected()).toBeFalsy();
    emitCloseEvent = true;

    client.login(loginData).subscribe(
      loginResponse => {
        done.fail(new Error('Not failed'));
      },
      err => {
        let args;

        expect(deepstreamStub).toHaveBeenCalledWith(connectionString);
        expect(Client.GetDependencies).toHaveBeenCalled();
        expect(mockDeepstream.login).toHaveBeenCalled();
        expect(mockDeepstream.close).toHaveBeenCalled();
        args = mockDeepstream.login.calls.mostRecent().args;
        expect(args[0]).toEqual(loginData);
        expect(client.isConnected()).toBeFalsy();
        done();
      }
    );
    mockDeepstream.emit('connectionStateChanged', 'TESTFAIL');
  });

  it('should retry when some calls failed', done => {
    let client = new Client(connectionString);
    let subscripion = client.login(loginData).subscribe(() => done());
    mockDeepstream.emit('connectionStateChanged', 'ERROR');
    mockDeepstream.emit('connectionStateChanged', 'ERROR');
    mockDeepstream.emit('error', 'ERROR');
    mockDeepstream.emit('connectionStateChanged', 'OPEN');
  });

  it('should be able to close the connection', async done => {
    let client = new Client(connectionString);
    client
      .login(loginData)
      .do(() => expect(client.isConnected()).toBeTruthy())
      .switchMap(() => {
        let res$ = client.close();
        return res$;
      })
      .subscribe(() => {
        // This means that at the "FOOBAR" event no close is called
        expect(mockDeepstream.close).toHaveBeenCalledTimes(1);
        expect(client.isConnected()).toBeFalsy();
        done();
      });

    mockDeepstream.emit('connectionStateChanged', 'OPEN');
    // This will test if the close observer emits only at the 'close' event
    mockDeepstream.emit('connectionStateChanged', 'FOOBAR');
    mockDeepstream.emit('connectionStateChanged', 'CLOSED');
  });

  it('should handle close request even if the client is not connected', done => {
    let client = new Client(connectionString);
    client.close().subscribe(() => {
      expect(mockDeepstream.close).not.toHaveBeenCalled();
      done();
    });
  });

  it('should handle re-login: if the client is logged in, close the connection', done => {
    let client = new Client(connectionString);
    emitCloseEvent = true;

    client
      .login(loginData)
      .do(() => {
        expect(mockDeepstream.close).not.toHaveBeenCalled();
      })
      .switchMap(() => {
        let res$ = client.login(loginData);
        return res$;
      })
      .subscribe(() => {
        expect(mockDeepstream.close).not.toHaveBeenCalled();
        done();
      });
    mockDeepstream.emit('connectionStateChanged', 'OPEN');
    mockDeepstream.emit('connectionStateChanged', 'OPEN');
  });
});

describe('Without mocking the deepstream dependencies', () => {
  it('GetDependencies should return the deepstream factory', () => {
    expect(Client.GetDependencies()).not.toBeNull();
  });
});
