import { createSSEObservable } from './sse.utils';

describe('createSSEObservable', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
  });

  it('emits parsed data and completes', (done) => {
    const encoder = new TextEncoder();
    const chunk = encoder.encode('data: {"ok":true}\n\n');
    let calls = 0;
    const reader = {
      read: () => {
        calls++;
        if (calls === 1) return Promise.resolve({ done: false, value: chunk });
        return Promise.resolve({ done: true, value: undefined });
      }
    } as any;

    (globalThis as any).fetch = jestFetchMock(responseWithReader(reader));

    const obs = createSSEObservable('/url', 't', { run: (fn: any) => fn() });
    const sub = obs.subscribe({
      next: (v) => {
        expect(v).toEqual({ ok: true });
        sub.unsubscribe();
        done();
      },
      error: (e) => fail(e)
    });
  });

  it('logs invalid JSON but does not error the stream', (done) => {
    spyOn(console, 'error');
    const encoder = new TextEncoder();
    const chunk = encoder.encode('data: not-json\n\n');
    let call = 0;
    const reader = {
      read: () => {
        call++;
        if (call === 1) return Promise.resolve({ done: false, value: chunk });
        return Promise.resolve({ done: true, value: undefined });
      }
    } as any;

    (globalThis as any).fetch = jestFetchMock(responseWithReader(reader));

    const obs = createSSEObservable('/url', 't', { run: (fn: any) => fn() });
    obs.subscribe({
      next: () => fail('should not emit valid next for invalid json'),
      error: (e) => fail(e),
      complete: () => {
        expect((console.error as jasmine.Spy).calls.count()).toBeGreaterThan(0);
        done();
      }
    });
  });

  it('errors when fetch rejects', (done) => {
    (globalThis as any).fetch = () => Promise.reject(new Error('fail'));
    const obs = createSSEObservable('/url', 't', { run: (fn: any) => fn() });
    obs.subscribe({
      next: () => fail('should not next'),
      error: (e) => {
        expect(e).toBeTruthy();
        done();
      }
    });
  });

  it('errors when response.body is null', (done) => {
    (globalThis as any).fetch = () => Promise.resolve({ body: null } as any);
    const obs = createSSEObservable('/url', 't', { run: (fn: any) => fn() });
    obs.subscribe({
      next: () => fail('should not next'),
      error: (e) => {
        expect(e).toBeTruthy();
        done();
      }
    });
  });
});

function responseWithReader(reader: any) {
  return Promise.resolve({ body: { getReader: () => reader } } as any);
}

function jestFetchMock(promise: Promise<any>) {
  return () => promise;
}
