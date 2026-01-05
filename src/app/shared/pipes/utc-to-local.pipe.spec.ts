import { TestBed } from '@angular/core/testing';
import { UtcToLocalPipe } from './utc-to-local.pipe';
import { DatePipe } from '@angular/common';
import { LOCALE_ID } from '@angular/core';

describe('UtcToLocalPipe', () => {
  let pipe: UtcToLocalPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DatePipe,
        { provide: LOCALE_ID, useValue: 'en-US' }
      ]
    });

    pipe = new UtcToLocalPipe(TestBed.inject(DatePipe));
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should format ISO string using provided format', () => {
    const iso = '2020-01-02T00:00:00Z';
    expect(pipe.transform(iso, 'yyyy-MM-dd')).toBe('2020-01-02');
  });

  it('should format Date object correctly', () => {
    const date = new Date(2020, 0, 2);
    expect(pipe.transform(date, 'dd/MM/yyyy')).toBe('02/01/2020');
  });

  it('should call DatePipe internally', () => {
    const dp = TestBed.inject(DatePipe);
    const spy = spyOn(dp, 'transform').and.returnValue('mock');

    const result = pipe.transform('2020-01-02T00:00:00Z');
    expect(spy).toHaveBeenCalled();
    expect(result).toBe('mock');
  });
  it('should return empty string when DatePipe.transform returns null', () => {
  const datePipe = TestBed.inject(DatePipe);
  spyOn(datePipe, 'transform').and.returnValue(null);
  const result = pipe.transform('2020-01-02T00:00:00Z');
  expect(result).toBe('');
});

});
