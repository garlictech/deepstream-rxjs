import { Subscription } from 'rxjs';

import { Event } from '..';
import { Client } from '../../client';

interface TestData {
  foo: string;
}

describe('Test Record', () => {
  let subscribeSpy: jasmine.Spy;
  let emitSpy: jasmine.Spy;
  let unsubscribeSpy: jasmine.Spy;
  let topicName = 'topic';

  let data: TestData = {
    foo: 'bar'
  };

  class MockClient extends Client {}

  beforeEach(() => {
    subscribeSpy = jasmine.createSpy('subscribeSpy');
    emitSpy = jasmine.createSpy('emitSpy');
    unsubscribeSpy = jasmine.createSpy('unsubscribeSpy');

    spyOn(Client, 'GetDependencies').and.callFake(() => {
      return {
        deepstream: jasmine.createSpy('deepstreamStub').and.returnValue({
          event: {
            subscribe: subscribeSpy,
            unsubscribe: unsubscribeSpy,
            emit: emitSpy
          }
        })
      };
    });
  });

  describe('When we subscribe to the topic', () => {
    it('it should return an observable, and emit should be called properly', () => {
      let client = new MockClient('atyala');
      let event = new Event<TestData>(client, topicName);
      let event$ = event.receive().subscribe();
      expect(event$ instanceof Subscription).toBeTruthy();
      expect(subscribeSpy).toHaveBeenCalledWith(topicName, jasmine.any(Function));
      event$.unsubscribe();
      expect(unsubscribeSpy).toHaveBeenCalledWith(topicName);
      event.emit(data);
      expect(emitSpy).toHaveBeenCalledWith(topicName, data);
    });
  });
});
