import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PricingsService } from './pricing.service';

describe('PricingsService', () => {
  let service: PricingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PricingsService]
    });

    service = TestBed.inject(PricingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getInvoiceList should call invoices endpoint with query params', (done) => {
    service.getInvoiceList('acc1', 10, 0).subscribe(res => {
      expect(res).toEqual({ success: true });
      done();
    });

    const req = httpMock.expectOne(req => req.method === 'GET' && req.url.includes('/invoices'));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('account_id=acc1');
    expect(req.request.urlWithParams).toContain('limit=10');
    expect(req.request.urlWithParams).toContain('offset=0');
    req.flush({ success: true });
  });

  it('paynow should POST invoiceId and return order', (done) => {
    service.paynow('42').subscribe(res => {
      expect(res).toEqual({ order: { payment_session_id: 'sid' } });
      done();
    });

    const req = httpMock.expectOne(r => r.method === 'POST' && r.url.endsWith('/pay'));
    expect(req.request.body).toEqual({ invoiceId: '42' });
    req.flush({ order: { payment_session_id: 'sid' } });
  });

  it('maps server error with error.details to thrown Error.message', (done) => {
    service.paynow('x').subscribe({ next: () => {}, error: (err) => {
      expect(err.message).toBe('detailed error');
      done();
    }});

    const req = httpMock.expectOne(r => r.method === 'POST');
    req.flush({ error: { details: 'detailed error' } }, { status: 500, statusText: 'Server Error' });
  });

  it('maps server error with error.message to thrown Error.message', (done) => {
    service.getInvoiceList('a', 1, 0).subscribe({ next: () => {}, error: (err) => {
      expect(err.message).toBe('simple message');
      done();
    }});

    const req = httpMock.expectOne(r => r.method === 'GET');
    req.flush({ message: 'simple message' }, { status: 400, statusText: 'Bad Request' });
  });

  it('returns generic message for network errors', (done) => {
    service.paynow('z').subscribe({ next: () => {}, error: (err) => {
      expect(err.message).toBe('Something went wrong. Please try again later.');
      done();
    }});

    const req = httpMock.expectOne(r => r.method === 'POST');
    req.error(new ErrorEvent('Network error'));
  });
});
