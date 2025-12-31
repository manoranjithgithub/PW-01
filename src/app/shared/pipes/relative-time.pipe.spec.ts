import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    pipe = new RelativeTimePipe();
  });

  it('returns empty string for falsy values', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('returns a human readable relative time string for past dates', () => {
    const now = Date.now();
    const past = new Date(now - 1000 * 60 * 60 * 24); // 1 day ago
    const out = pipe.transform(past);
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
    // typically contains 'ago'
    expect(out).toMatch(/ago|in/);
  });
});
