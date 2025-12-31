import { TestBed } from '@angular/core/testing';
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

    // flush the initial constructor ensureRatesFor(['INR']) call if present
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
    // ensure empty rates and old timestamp to force fallback
    (service as any).rates = {};
    (service as any).ratesLoadedAt = 0;
    const out = service.convertAmount(100, 'USD', 'INR');
    // fallback INR 89.62 expected
    expect(Math.round(out)).toBe(Math.round(100 * 89.62));
    // consume any async rates request triggered by convertAmount
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
});
