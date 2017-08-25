import {Rpc} from '..';
import {Client} from '../../client';

describe('When the rpc call is successfull', () => {
  it('should return a resolved promise', async () => {
    class MockClient extends Client {
      constructor(_connectionString: string) {
        super(_connectionString);
        this.client = {
          rpc: {
            make: (name, data, cb) => cb(null, 'OK')
          }
        };
      }
    }

    let rpc = new Rpc(new MockClient('foobar'));
    let res = await rpc.make('foo', {}).toPromise();
    expect(res).toEqual('OK');
  });
});

describe('When the rpc call is unsuccessfull', () => {
  it('should return a rejected promise', async done => {
    class MockClient extends Client {
      constructor(_connectionString: string) {
        super(_connectionString);
        this.client = {
          rpc: {
            make: (name, data, cb) => cb('ERROR', null)
          }
        };
      }
    }

    let rpc = new Rpc(new MockClient('foobar'));

    await rpc.make('foo', {}).toPromise().catch(err => {
      expect(err).toEqual('ERROR');
      done();
    });
  });

  describe('When the error is a json object', () => {
    it('should return the parsed object, not the error string', async () => {
      const errorObj = {error: 'error'};
      class MockClient extends Client {
        constructor(_connectionString: string) {
          super(_connectionString);
          this.client = {rpc: {make: (name, data, cb) => cb(errorObj, null)}};
        }
      }

      let rpc = new Rpc(new MockClient('foobar'));

      await rpc.make('foo', {}).toPromise().catch(err => {
        expect(err).toEqual(errorObj);
      });
    });
  });
});

describe('When we call provide', () => {
  it("should call the client's provide method properly", () => {
    let provideSpy = jasmine.createSpy('provide');

    class MockClient extends Client {
      public client = {
        rpc: {
          provide: provideSpy
        }
      };
    }

    let rpc = new Rpc(new MockClient('foobar'));
    let providerFv = () => {
      return;
    };
    rpc.provide('providerName', providerFv);
    expect(provideSpy).toHaveBeenCalledWith('providerName', providerFv);
  });

  it('should return a rejected promise', async done => {
    class MockClient extends Client {
      constructor(_connectionString: string) {
        super(_connectionString);
        this.client = {
          rpc: {
            make: (name, data, cb) => cb('ERROR', null)
          }
        };
      }
    }
    let rpc = new Rpc(new MockClient('foobar'));

    await rpc.make('foo', {}).toPromise().catch(err => {
      expect(err).toEqual('ERROR');
      done();
    });
  });
});
