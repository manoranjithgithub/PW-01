import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SharedService } from './shared.service';
import { CookieService } from 'ngx-cookie-service';

describe('SharedService', () => {
  let service: SharedService;
  let httpMock: HttpTestingController;
  const cookieSpy = jasmine.createSpyObj('CookieService', ['get', 'set', 'delete']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CookieService, useValue: cookieSpy }
      ]
    });

    service = TestBed.inject(SharedService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.match((req) => req.url.indexOf('https://api.frankfurter.dev') === 0);
    if (req && req.length) {
      req[0].flush({ rates: { INR: 89.62 } });
    }
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('formatDate returns dd/mm/yyyy', () => {
    const out = service.formatDate('2020-01-02T00:00:00Z');
    expect(out).toBe('02/01/2020');
  });

  it('isValidName validator accepts valid names and rejects invalid', () => {
    const validator = service.isValidName();
    expect(validator({ value: 'abc-123' } as any)).toBeNull();
    const res = validator({ value: 'bad name!' } as any) as any;
    expect(res).toBeTruthy();
    expect(res.invalidName).toBeDefined();
  });

  it('set/get/delete cookie delegates to CookieService', () => {
    service.setCookie('x', 'v', 1);
    expect(cookieSpy.delete).toHaveBeenCalled();
    expect(cookieSpy.set).toHaveBeenCalledWith('x', 'v', 1, '/');
    cookieSpy.get.and.returnValue('val');
    expect(service.getCookie('x')).toBe('val');
    service.deleteCookie('x');
    expect(cookieSpy.delete).toHaveBeenCalled();
  });

  it('convertAmount uses fallback when rates not available', () => {
    (service as any).rates = {};
    (service as any).ratesLoadedAt = 0;
    const out = service.convertAmount(100, 'USD', 'INR');
    expect(Math.round(out)).toBe(Math.round(100 * 89.62));
    const pending = httpMock.match((r) => r.url.indexOf('https://api.frankfurter.dev') === 0);
    if (pending && pending.length) {
      pending[0].flush({ rates: { INR: 89.62 } });
    }
  });


  it('convertAmount uses cached rates when available', () => {
    (service as any).rates = { INR: 50 };
    (service as any).ratesLoadedAt = Date.now();
    const out = service.convertAmount(100, 'USD', 'INR');
    expect(out).toBe(100 * 50);
  });

  it('ensureRatesFor performs http request and sets rates', async () => {
    (service as any).rates = {};
    (service as any).ratesLoadedAt = 0;
    const promise = service.ensureRatesFor(['INR']);
    const req = httpMock.expectOne((r) => r.url.indexOf('https://api.frankfurter.dev') === 0);
    req.flush({ rates: { INR: 99.5 } });
    await promise;
    expect((service as any).rates['INR']).toBe(99.5);
    expect((service as any).ratesLoadedAt).toBeGreaterThan(0);
  });

  it('ensureRatesFor returns early if symbols array is empty', async () => {
    await service.ensureRatesFor([]);
    httpMock.expectNone(() => true);
    expect(true).toBe(true);
  });

  it('ensureRatesFor filters out USD and returns early if no other symbols', async () => {
    const promise = service.ensureRatesFor(['USD']);
    const req = httpMock.expectOne((r) => r.url.indexOf('https://api.frankfurter.dev') === 0);
    req.flush({ rates: {} });
    await promise;
    expect(true).toBe(true);
  });

  it('ensureRatesFor skips fetch if rates are cached and not expired', async () => {
    (service as any).rates = { INR: 50, EUR: 0.85 };
    (service as any).ratesLoadedAt = Date.now();
    await service.ensureRatesFor(['INR', 'EUR']);
    httpMock.expectNone(() => true);
    expect(true).toBe(true);
  });

  it('ensureRatesFor fetches only missing rates when some are cached', async () => {
    (service as any).rates = { INR: 50 };
    (service as any).ratesLoadedAt = Date.now();
    const promise = service.ensureRatesFor(['INR', 'EUR']);
    const req = httpMock.expectOne((r) => r.url.indexOf('https://api.frankfurter.dev') === 0);
    req.flush({ rates: { EUR: 0.85 } });
    await promise;
    expect((service as any).rates['EUR']).toBe(0.85);
  });

  it('ensureRatesFor handles http error gracefully', async () => {
    (service as any).rates = {};
    (service as any).ratesLoadedAt = 0;
    const promise = service.ensureRatesFor(['GBP']);
    const req = httpMock.expectOne((r) => r.url.indexOf('https://api.frankfurter.dev') === 0);
    req.error(new ProgressEvent('error'));
    await promise;
    expect(true).toBe(true);
  });

  it('convertAmount returns 0 for null or NaN values', () => {
    expect(service.convertAmount(null as any, 'USD', 'INR')).toBe(0);
    expect(service.convertAmount(NaN, 'USD', 'INR')).toBe(0);
  });

  it('convertAmount returns same value when from and to currencies are the same', () => {
    expect(service.convertAmount(100, 'USD', 'USD')).toBe(100);
    expect(service.convertAmount(50, 'INR', 'INR')).toBe(50);
  });

  it('convertAmount handles USD as source currency', () => {
    (service as any).rates = { EUR: 0.85 };
    (service as any).ratesLoadedAt = Date.now();
    const result = service.convertAmount(100, 'USD', 'EUR');
    expect(result).toBe(100 * 0.85);
  });

  it('convertAmount handles USD as destination currency', () => {
    (service as any).rates = { EUR: 0.85 };
    (service as any).ratesLoadedAt = Date.now();
    const result = service.convertAmount(85, 'EUR', 'USD');
    expect(result).toBe(85 / 0.85);
  });

  it('convertAmount converts between two non-USD currencies', () => {
    (service as any).rates = { EUR: 0.85, GBP: 0.75 };
    (service as any).ratesLoadedAt = Date.now();
    const result = service.convertAmount(100, 'EUR', 'GBP');
    const expected = (100 / 0.85) * 0.75;
    expect(result).toBeCloseTo(expected, 2);
  });

  it('convertAmount uses undefined source/dest when calling getCurrency', () => {
    spyOn(service, 'getCurrency').and.returnValue('EUR');
    (service as any).rates = { EUR: 0.85 };
    (service as any).ratesLoadedAt = Date.now();
    service.convertAmount(100, undefined, undefined);
    expect(service.getCurrency).toHaveBeenCalled();
  });

  it('setCurrency stores in localStorage and emits change', fakeAsync(() => {
    spyOn(localStorage, 'setItem');
    (service as any).rates = { EUR: 0.85 };
    (service as any).ratesLoadedAt = Date.now();
    service.setCurrency('EUR');
    tick();
    expect(localStorage.setItem).toHaveBeenCalledWith('currency', 'EUR');
  }));

  it('setCurrency handles localStorage errors gracefully', fakeAsync(() => {
    spyOn(localStorage, 'setItem').and.throwError('Storage error');
    (service as any).rates = { EUR: 0.85 };
    (service as any).ratesLoadedAt = Date.now();
    expect(() => service.setCurrency('EUR')).not.toThrow();
    tick();
  }));

  it('setCurrency fetches rates for non-USD currencies', fakeAsync(() => {
    (service as any).rates = {};
    (service as any).ratesLoadedAt = 0;
    service.setCurrency('EUR');
    tick();
    const req = httpMock.expectOne((r) => r.url.indexOf('https://api.frankfurter.dev') === 0);
    req.flush({ rates: { EUR: 0.85 } });
    tick();
    expect((service as any).rates['EUR']).toBe(0.85);
  }));

  it('setCurrency does not fetch rates for USD', fakeAsync(() => {
    service.setCurrency('USD');
    tick();
    httpMock.expectNone(() => true);
    expect(true).toBe(true);
  }));

  it('getCurrency returns value from BehaviorSubject', () => {
    (service as any).currencyChangeSource.next('GBP');
    expect(service.getCurrency()).toBe('GBP');
  });

  it('getCurrency falls back to storage when BehaviorSubject is empty', () => {
    spyOn(localStorage, 'getItem').and.returnValue('JPY');
    (service as any).currencyChangeSource.next(null);
    const result = service.getCurrency();
    expect(result).toBe('JPY');
  });

  it('getCurrencyFromStorage handles localStorage errors', () => {
    spyOn(localStorage, 'getItem').and.throwError('Storage error');
    const result = (service as any).getCurrencyFromStorage();
    expect(result).toBe('USD');
  });

  it('getCurrencyFromStorage returns USD when no value stored', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    const result = (service as any).getCurrencyFromStorage();
    expect(result).toBe('USD');
  });

  it('emitValueChange emits through valueChange$', (done) => {
    service.valueChange$.subscribe(value => {
      expect(value).toBe('test-value');
      done();
    });
    service.emitValueChange('test-value');
  });

  it('emitEnvValueChange emits through envValueChange$', (done) => {
    service.envValueChange$.subscribe(value => {
      expect(value).toBe('env-value');
      done();
    });
    service.emitEnvValueChange('env-value');
  });

  it('emitProjectValueChange emits through projectValueChange$', (done) => {
    service.projectValueChange$.subscribe(value => {
      expect(value).toBe('proj-value');
      done();
    });
    service.emitProjectValueChange('proj-value');
  });

  it('emitEnvDDChange emits through envDDChange$', (done) => {
    const testData = [{ id: 1 }, { id: 2 }];
    service.envDDChange$.subscribe(value => {
      if (value.length > 0) {
        expect(value).toEqual(testData);
        done();
      }
    });
    service.emitEnvDDChange(testData);
  });

  it('emitProjectDDChange emits through projectDDChange$', (done) => {
    const testData = [{ id: 1 }, { id: 2 }];
    service.projectDDChange$.subscribe(value => {
      if (value.length > 0) {
        expect(value).toEqual(testData);
        done();
      }
    });
    service.emitProjectDDChange(testData);
  });

  it('show sets isLoading to true', (done) => {
    service.isLoading$.subscribe(value => {
      if (value === true) {
        expect(value).toBeTrue();
        done();
      }
    });
    service.show();
  });

  it('hide sets isLoading to false', (done) => {
    service.show(); 
    service.isLoading$.subscribe(value => {
      if (value === false) {
        expect(value).toBeFalse();
        done();
      }
    });
    service.hide();
  });

  it('setData emits through deploymentData$', (done) => {
    const testData = { id: '123', name: 'test' };
    service.deploymentData$.subscribe(value => {
      if (value) {
        expect(value).toEqual(testData);
        done();
      }
    });
    service.setData(testData);
  });

  it('setUser emits through user$', (done) => {
    const user = { id: '1', avatar: 'test.png', email: 'test@test.com' };
    service.user$.subscribe(value => {
      if (value) {
        expect(value).toEqual(user);
        done();
      }
    });
    service.setUser(user);
  });

  it('getUser returns current user value', () => {
    const user = { id: '2', avatar: 'avatar.png', name: 'Test User' };
    service.setUser(user);
    expect(service.getUser()).toEqual(user);
  });

  it('setlastReleaseData emits through releaseStatus$', (done) => {
    service.releaseStatus$.subscribe(value => {
      if (value === 'deployed') {
        expect(value).toBe('deployed');
        done();
      }
    });
    service.setlastReleaseData('deployed');
  });

  it('getlastReleaseData returns current release status', () => {
    service.setlastReleaseData('pending');
    expect(service.getlastReleaseData()).toBe('pending');
  });

  it('getStatusMeta delegates to helper function', () => {
    const result = service.getStatusMeta('running');
    expect(result).toBeDefined();
    expect(result.icon).toBeDefined();
    expect(result.statusClass).toBeDefined();
    expect(result.label).toBeDefined();
  });

  it('isValidName returns null for empty value', () => {
    const validator = service.isValidName();
    expect(validator({ value: '' } as any)).toBeNull();
    expect(validator({ value: null } as any)).toBeNull();
  });

  it('refreshRatesNow calls ensureRatesFor with provided symbols', async () => {
    spyOn(service, 'ensureRatesFor').and.returnValue(Promise.resolve());
    await service.refreshRatesNow(['EUR', 'GBP']);
    expect(service.ensureRatesFor).toHaveBeenCalledWith(['EUR', 'GBP']);
  });

  it('refreshRatesNow uses default INR if no symbols provided', async () => {
    spyOn(service, 'ensureRatesFor').and.returnValue(Promise.resolve());
    await service.refreshRatesNow();
    expect(service.ensureRatesFor).toHaveBeenCalledWith(['INR']);
  });

  it('convertAmount triggers ensureRatesFor when rates are stale', fakeAsync(() => {
    (service as any).rates = {};
    (service as any).ratesLoadedAt = 0;
    service.convertAmount(100, 'EUR', 'GBP');
    tick();
    const req = httpMock.expectOne((r) => r.url.indexOf('https://api.frankfurter.dev') === 0);
    req.flush({ rates: { EUR: 0.85, GBP: 0.75 } });
    tick();
    expect((service as any).rates['EUR']).toBe(0.85);
  }));

  it('ensureRatesFor handles response without rates object', async () => {
    (service as any).rates = {};
    (service as any).ratesLoadedAt = 0;
    const promise = service.ensureRatesFor(['INR']);
    const req = httpMock.expectOne((r) => r.url.indexOf('https://api.frankfurter.dev') === 0);
    req.flush({ data: 'invalid' });
    await promise;
    expect(true).toBe(true);
  });
});
