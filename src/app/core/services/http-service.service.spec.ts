import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpService } from './http-service.service';
import { environment } from '../../../environments/environment';

describe('HttpService', () => {
  let service: HttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpService]
    });

    service = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getRefreshToken posts to usermanagement endpoint', () => {
    const payload = { refreshToken: 'r1', state: 's' };
    service.getRefreshToken(payload).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ok: true });
  });

  it('should handle client-side ErrorEvent and return user-facing error', (done) => {
    const consoleSpy = spyOn(console, 'error');
    service.getRefreshToken({ foo: 'bar' }).subscribe({
      next: () => fail('expected an error'),
      error: (err) => {
        expect(err).toBe('Something bad happened; please try again later.');
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.calls.mostRecent().args[0]).toBe('An error occurred:');
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/users`);
    const ev = new ErrorEvent('Network error', { message: 'network down' });
    req.error(ev);
  });

  it('should handle backend error response and return user-facing error (400)', (done) => {
    const consoleSpy = spyOn(console, 'error');
    service.getRefreshToken({}).subscribe({
      next: () => fail('expected an error'),
      error: (err) => {
        expect(err).toBe('Something bad happened; please try again later.');
        expect(consoleSpy).toHaveBeenCalled();
        const msg = consoleSpy.calls.mostRecent().args[0] as string;
        expect(msg).toContain('Backend returned code 400');
        expect(msg).toContain('body was:');
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/users`);
    req.flush({ message: 'bad' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should log and propagate server error with null body', (done) => {
    const consoleSpy = spyOn(console, 'error');
    service.getRefreshToken({}).subscribe({ next: () => {}, error: (err) => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(err).toBe('Something bad happened; please try again later.');
      done();
    } });

    const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/users`);
    req.flush(null, { status: 500, statusText: 'Server Error' });
  });
});
