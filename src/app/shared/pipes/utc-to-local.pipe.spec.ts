import { TestBed } from '@angular/core/testing';
import { UtcToLocalPipe } from './utc-to-local.pipe';
import { DatePipe } from '@angular/common';

describe('UtcToLocalPipe', () => {
  let pipe: UtcToLocalPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DatePipe] });
    const dp = TestBed.inject(DatePipe);
    pipe = new UtcToLocalPipe(dp);
  });

  it('transforms null/undefined to empty string', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('formats ISO date string using provided format', () => {
    const iso = '2020-01-02T00:00:00Z';
    const out = pipe.transform(iso, 'yyyy-MM-dd');
    expect(out).toBe('2020-01-02');
  });
});
