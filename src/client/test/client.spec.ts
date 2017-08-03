import { Client } from '..'
import { EventEmitter } from "events"

describe("Then deepstream client is up and running", () => {
  class MockDeepstream extends EventEmitter {
    constructor() {super()}
    login = jasmine.createSpy("login")
  }

  let mockDeepstream
  let DeepstreamStub
  let loginData = {providerName: "UNIT TEST PROVIDER", jwtToken: "foobar"}
  let connectionString = "foobar"
  
  beforeEach(() => {
    mockDeepstream = new MockDeepstream()

    DeepstreamStub = jasmine.createSpy("DeepstreamStu").and.callFake(() => {
      return mockDeepstream
    })
  
    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return {deepstream: DeepstreamStub}
    })
  })

  it("should connect when the server is up", (done) => {
    let client = new Client(connectionString)
    expect(Client.GetDependencies).toHaveBeenCalled()
    expect(DeepstreamStub).toHaveBeenCalledWith(connectionString)

    let subscripion = client.login(loginData).subscribe(() => {
      expect(mockDeepstream.login).toHaveBeenCalledWith(loginData)
      done()
    })

    mockDeepstream.emit("connectionStateChanged", "OPEN")
  })

  it("should retry when some calls failed", (done) => {
    let client = new Client(connectionString)

    let subscripion = client.login(loginData).subscribe(() => {
      done()
    })

    mockDeepstream.emit("connectionStateChanged", "ERROR")
    mockDeepstream.emit("connectionStateChanged", "ERROR")
    mockDeepstream.emit("error", "ERROR")
    mockDeepstream.emit("connectionStateChanged", "OPEN")
  })
})
