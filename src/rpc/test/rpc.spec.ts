import { Rpc } from '..'
import { Client } from '../../client'

describe("When the rpc call is successfull", () => {
  it("should return a resolved promise", async () => {
    class MockClient extends Client {
      constructor(_connectionString: string) {
        super(_connectionString)
        this.client = {
          rpc: {
            make: (name, data, cb) => cb(null, "OK")
          }
        }
      }
    }

    let rpc = new Rpc(new MockClient("foobar"))
    let res = await rpc.make("foo", {}).toPromise()
    expect(res).toEqual("OK")
  })
})

describe("When the rpc call is unsuccessfull", () => {
  it("should return a rejected promise", async (done) => {
    class MockClient extends Client {
      constructor(_connectionString: string) {
        super(_connectionString)
        this.client = {
          rpc: {
            make: (name, data, cb) => cb("ERROR", null)
          }
        }
      }
    }

    let rpc = new Rpc(new MockClient("foobar"))

    await rpc.make("foo", {}).toPromise()
    .catch((err) => {
      expect(err).toEqual("ERROR")
      done()
    })
  })

  describe("When we call provide", () => {
    it("should call the client's provide method properly", () => {
      let provideSpy = jasmine.createSpy("provide")

      class MockClient extends Client {
        client = {
          rpc: {
            provide: provideSpy

          }
        }
      }

      let rpc = new Rpc(new MockClient("foobar"))
      let providerFv = () => {}
      rpc.provide("providerName", providerFv)
      expect(provideSpy).toHaveBeenCalledWith("providerName", providerFv)
    })
  })
})