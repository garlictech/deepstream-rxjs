import { Record } from '..'
import { Client } from '../../client'

describe("Test record", () => {
  let setDataSpy: any
  let snapshotSpy: any
  let recordName = "recordName"

  let data = {
    foo: "bar"
  }
  class MockClient extends Client {
    client = {
      record: {
        setData: setDataSpy,
        snapshot: snapshotSpy
      }
    }
  }

  describe("When we try to set any data", () => {
    it("should do it", async () => {
      setDataSpy = jasmine.createSpy("setData").and.callFake((name, path, data, cb) => {
        cb()
      })

      let client = new MockClient("atyala")
      let record = new Record(client, recordName)
      let result = await record.setData(data, "path").toPromise()
      let args = setDataSpy.calls.mostRecent().args
      expect(args[0]).toEqual(recordName)
      expect(args[1]).toEqual("path")
      expect(args[2]).toEqual(data)
    })
  })

  describe("When the callback returns error", () => {
    it("should throw error", async (done) => {
      setDataSpy = jasmine.createSpy("setData").and.callFake((name, path, data, cb) => {
        cb("error")
      })
      
      let client = new MockClient("atyala")
      let record = new Record(client, recordName)  
      let result = await record.setData(data, "path").toPromise()
      .catch(err => {
        expect(err).toEqual("error")
        done()
      })
    })
  })

  describe("When we try to get the snapshot of any data", () => {
    it("should do return", async () => {
      snapshotSpy = jasmine.createSpy("snapshot").and.callFake((name, cb) => {
        cb(null, data)
      })

      let client = new MockClient("atyala")
      let record = new Record(client, recordName)
      let result = await record.snapshot().toPromise()
      let args = snapshotSpy.calls.mostRecent().args
      expect(args[0]).toEqual(recordName)
      expect(result).toEqual(data)
    })
  })

  describe("When the snapshot returns error", () => {
    it("should throw error", async (done) => {
      snapshotSpy = jasmine.createSpy("snapshot").and.callFake((name, cb) => {
        cb("error", data)
      })
      
      let client = new MockClient("atyala")
      let record = new Record(client, recordName)  
      let result = await record.snapshot().toPromise()
      .catch(err => {
        expect(err).toEqual("error")
        done()
      })
    })
  })
})
