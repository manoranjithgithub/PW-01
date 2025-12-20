import { Observable } from 'rxjs';

export function createSSEObservable<T>(
  url: string,
  token: string,
  zone: any
): Observable<T> {
  return new Observable(observer => {
    const controller = new AbortController();

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: controller.signal
    })
      .then(response => {
        if (!response.body) throw new Error('No SSE response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        const read = () => {
          reader.read()
            .then(({ done, value }) => {
              if (done) {
                observer.complete();
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.startsWith('data:')) continue;

                const jsonStr = line.slice(5).trim();
                try {
                  const data = JSON.parse(jsonStr);
                  zone.run(() => observer.next(data));
                } catch (err) {
                  console.error('Invalid SSE JSON:', err);
                }
              }

              read();
            })
            .catch(err => observer.error(err));
        };

        read();
      })
      .catch(err => observer.error(err));

    return () => {
      controller.abort();
    };
  });
}
