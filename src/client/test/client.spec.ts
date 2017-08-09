import { Client } from '..'
import { EventEmitter } from "events"
import * as deepstream from 'deepstream.io-client-js'

describe("The deepstream client is up and running", () => {
  class MockDeepstream extends EventEmitter {
    private _state = deepstream.CONSTANTS.CONNECTION_STATE.OPEN
    constructor() {super()}
    login = jasmine.createSpy("login").and.callFake(() => this._state = deepstream.CONSTANTS.CONNECTION_STATE.OPEN)
    close = jasmine.createSpy("close").and.callFake(() => {
      this.emit("connectionStateChanged", "CLOSED")
      this._state = deepstream.CONSTANTS.CONNECTION_STATE.CLOSED
    })
    getConnectionState() { return this._state }
  }

  let mockDeepstream
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

  it("should connect when the server is up", (done) => {
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

  it("should logout", (done) => {
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
})
