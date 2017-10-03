import { Rpc } from '..';
import { Client } from '../../client';

describe('When the rpc call is successfull', () => {
  it('should return a resolved promise', done => {
    class MockClient extends Client {}

    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return {
        deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
          rpc: {
            make: (name, data, cb) => cb(null, 'OK')
          }
        })
      };
    });

    let client = new MockClient('foobar');
    let rpc = new Rpc(client);
    let res$ = rpc.make('foo', {}).subscribe(res => {
      expect(res).toEqual('OK');
      expect(client.errors$.closed).toBeFalsy();
      done();
    });
  });

  it('should execute the unsubscription if unsubscribed before receiving value', () => {
    class MockClient extends Client {}

    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return {
        deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
          rpc: {
            make: (name, data, cb) => {
              /* EMPTY */
            }
          }
        })
      };
    });

    let client = new MockClient('foobar');
    let unsubscribeSpy = { unsubscribe: jasmine.createSpy('unsubscribeSpy') };
    spyOn(client.errors$, 'subscribe').and.returnValue(unsubscribeSpy);
    let rpc = new Rpc(client);
    let res$ = rpc.make('foo', {}).subscribe(res => {
      /* EMPTY */
    });

    res$.unsubscribe();
    expect(unsubscribeSpy.unsubscribe).toHaveBeenCalled();
  });

  describe('When the rpc call is unsuccessfull', () => {
    it('should return a rejected promise', async done => {
      class MockClient extends Client {}

      spyOn(Client, 'GetDependencies').and.callFake(() => {
        return {
          deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
            rpc: {
              make: (name, data, cb) => cb('ERROR', null)
            }
          })
        };
      });

      let client = new MockClient('foobar');
      let unsubscribeSpy = { unsubscribe: jasmine.createSpy('unsubscribeSpy') };
      spyOn(client.errors$, 'subscribe').and.returnValue(unsubscribeSpy);

      let rpc = new Rpc(client);

      await rpc
        .make('foo', {})
        .toPromise()
        .catch(err => {
          expect(err).toEqual('ERROR');
          expect(client.errors$.subscribe).toHaveBeenCalled();
          expect(unsubscribeSpy.unsubscribe).toHaveBeenCalled();
          done();
        });
    });

    describe('When the error is a json object', () => {
      it('should return the parsed object, not the error string', async () => {
        const errorObj = { error: 'error' };
        class MockClient extends Client {}

        spyOn(Client, 'GetDependencies').and.callFake(() => {
          return {
            deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
              rpc: {
                make: (name, data, cb) => cb(errorObj, null)
              }
            })
          };
        });

        let rpc = new Rpc(new MockClient('foobar'));

        await rpc
          .make('foo', {})
          .toPromise()
          .catch(err => {
            expect(err).toEqual(errorObj);
          });
      });
    });
  });

  describe('When we call provide', () => {
    it("should call the client's provide method properly", () => {
      let provideSpy = jasmine.createSpy('provide');

      class MockClient extends Client {}

      spyOn(Client, 'GetDependencies').and.callFake(() => {
        return {
          deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
            rpc: {
              provide: provideSpy
            }
          })
        };
      });

      let rpc = new Rpc(new MockClient('foobar'));
      let providerFv = () => {
        return;
      };
      rpc.provide('providerName', providerFv);
      expect(provideSpy).toHaveBeenCalledWith('providerName', providerFv);
    });

    it('should return a rejected promise in case of error', async done => {
      class MockClient extends Client {}

      spyOn(Client, 'GetDependencies').and.callFake(() => {
        return {
          deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
            rpc: {
              make: (name, data, cb) => cb('ERROR', null)
            }
          })
        };
      });

      let rpc = new Rpc(new MockClient('foobar'));

      await rpc
        .make('foo', {})
        .toPromise()
        .catch(err => {
          expect(err).toEqual('ERROR');
          done();
        });
    });

    describe('when the client emits an error', () => {
      it('the rpc must also emit an error', done => {
        class MockClient extends Client {}

        spyOn(Client, 'GetDependencies').and.callFake(() => {
          return {
            deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
              rpc: {
                make: (name, data, cb) => {
                  /* EMPTY */
                }
              }
            })
          };
        });

        let client = new MockClient('foobar');
        let rpc = new Rpc(client);

        rpc
          .make('foo', {})
          .toPromise()
          .catch(err => {
            expect(err).toEqual('ERROR');
            done();
          });
        client.errors$.next('ERROR');
      });
    });
  });
});
