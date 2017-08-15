import { Client } from '..'
import { EventEmitter } from "events"
let deepstream = require('deepstream.io-client-js')

describe("When the deepstream client is up and running, the client", () => {
  class MockDeepstream extends EventEmitter {
    private _state = deepstream.CONSTANTS.CONNECTION_STATE.OPEN
    constructor() {super()}
    login = jasmine.createSpy("login").and.callFake(() => {
      this._state = deepstream.CONSTANTS.CONNECTION_STATE.OPEN
    })
    close = jasmine.createSpy("close").and.callFake(() => {
      this.emit("connectionStateChanged", "CLOSED")
      this._state = deepstream.CONSTANTS.CONNECTION_STATE.CLOSED
    })
    getConnectionState() { return this._state }
  }

  let mockDeepstream: any
  let DeepstreamStub
  let loginData = {providerName: "UNIT TEST PROVIDER", jwtToken: "foobar"}
  let connectionString = "foobar"
  
  beforeEach(() => {
    mockDeepstream = new MockDeepstream()

    DeepstreamStub = jasmine.createSpy("DeepstreamStub").and.callFake(() => {
      return mockDeepstream
    })
  
    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return {deepstream: DeepstreamStub}
    })
  })
  
  it("should connect", (done) => {
    let client = new Client(connectionString)
    expect(client.isConnected()).toBeFalsy()

    client.login(loginData).subscribe(() => {
      expect(DeepstreamStub).toHaveBeenCalledWith(connectionString)
      expect(Client.GetDependencies).toHaveBeenCalled()
      expect(mockDeepstream.login).toHaveBeenCalledWith(loginData)
      expect(client.isConnected()).toBeTruthy()
      done()
    })

    mockDeepstream.emit("connectionStateChanged", "OPEN")
  })

  it("should retry when some calls failed", (done) => {
    let client = new Client(connectionString)
    let subscripion = client.login(loginData).subscribe(() => done())
    mockDeepstream.emit("connectionStateChanged", "ERROR")
    mockDeepstream.emit("connectionStateChanged", "ERROR")
    mockDeepstream.emit("error", "ERROR")
    mockDeepstream.emit("connectionStateChanged", "OPEN")
  })

  it("should be able to logout", (done) => {
    let client = new Client(connectionString)
    client.login(loginData)
    .do(() => expect(client.isConnected()).toBeTruthy())
    .map(() => client.logout())
    .do(() => {
      expect(mockDeepstream.close).toHaveBeenCalled()
      expect(client.isConnected()).toBeFalsy()
    })
    .subscribe(() => done())

    mockDeepstream.emit("connectionStateChanged", "OPEN")
  })

  it("should handle logout request even if the client is logged out", (done) => {
    let client = new Client(connectionString)
    client.logout()
    .subscribe(() =>{
      expect(mockDeepstream.close).not.toHaveBeenCalled()
      done()
    })
  })

  it("should handle re-login: if the client is logged in, close the connection", (done) => {
    let client = new Client(connectionString)
    client.login(loginData)
    .do(() => {
      expect(mockDeepstream.close).not.toHaveBeenCalled()
    })
    .switchMap(() => {
      let res$ = client.login(loginData)
      return res$
    })
    .subscribe(() =>{
      expect(mockDeepstream.close).toHaveBeenCalled()
      done()
    })
    mockDeepstream.emit("connectionStateChanged", "OPEN")
    mockDeepstream.emit("connectionStateChanged", "OPEN")
  })
})
