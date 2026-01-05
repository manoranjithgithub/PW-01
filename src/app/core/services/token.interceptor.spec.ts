import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { TokenInterceptor } from './token.interceptor';
import { AuthService } from './auth.service';
import { of, throwError, Subject } from 'rxjs';

describe('TokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['getAccessToken', 'refreshToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('accessToken');
  });

  it('adds Authorization header when access token exists', () => {
    authSpy.getAccessToken.and.returnValue('t-123');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer t-123');
    req.flush({});
  });

  it('does not add Authorization header when no access token', () => {
    authSpy.getAccessToken.and.returnValue(null);
    http.get('/api/noauth').subscribe();
    const req = httpMock.expectOne('/api/noauth');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('refreshes token on 401 and retries request', fakeAsync(() => {
    authSpy.getAccessToken.and.returnValue('old-token');
    authSpy.refreshToken.and.returnValue(of({ access_token: 'new-token' }));

    http.get('/api/secure').subscribe();

    const req1 = httpMock.expectOne('/api/secure');
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne('/api/secure');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({});

    tick();
  }));

  it('logs out if refreshToken fails', fakeAsync(() => {
    authSpy.getAccessToken.and.returnValue('old-token');
    authSpy.refreshToken.and.returnValue(throwError(() => new Error('refresh fail')));

    http.get('/api/secure').subscribe({
      error: () => {}
    });

    const req1 = httpMock.expectOne('/api/secure');
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });

    tick();

    expect(authSpy.logout).toHaveBeenCalled();
  }));

  it('queues requests during refresh and retries with new token', fakeAsync(() => {
    authSpy.getAccessToken.and.returnValue('old-token');
    const refreshSubject = new Subject<any>();
    authSpy.refreshToken.and.returnValue(refreshSubject.asObservable());

    http.get('/api/a').subscribe();
    const reqA = httpMock.expectOne('/api/a');
    reqA.flush({}, { status: 401, statusText: 'Unauthorized' });
    http.get('/api/b').subscribe();
    const reqB = httpMock.expectOne('/api/b');
    reqB.flush({}, { status: 401, statusText: 'Unauthorized' });
    refreshSubject.next({ access_token: 'new-token' });
    refreshSubject.complete();

    const retriedA = httpMock.expectOne('/api/a');
    const retriedB = httpMock.expectOne('/api/b');
    expect(retriedA.request.headers.get('Authorization')).toBe('Bearer new-token');
    expect(retriedB.request.headers.get('Authorization')).toBe('Bearer new-token');
    retriedA.flush({});
    retriedB.flush({});
    tick();
  }));

  it('calls refreshToken only once for multiple concurrent 401s', fakeAsync(() => {
    authSpy.getAccessToken.and.returnValue('old-token');
    const refreshSubject = new Subject<any>();
    authSpy.refreshToken.and.returnValue(refreshSubject.asObservable());
    http.get('/api/a').subscribe();
    const reqA = httpMock.expectOne('/api/a');
    reqA.flush({}, { status: 401, statusText: 'Unauthorized' });

    http.get('/api/b').subscribe();
    const reqB = httpMock.expectOne('/api/b');
    reqB.flush({}, { status: 401, statusText: 'Unauthorized' });

    http.get('/api/c').subscribe();
    const reqC = httpMock.expectOne('/api/c');
    reqC.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(authSpy.refreshToken).toHaveBeenCalledTimes(1);
    refreshSubject.next({ access_token: 'new-token' });
    refreshSubject.complete();

    const retriedA = httpMock.expectOne('/api/a');
    const retriedB = httpMock.expectOne('/api/b');
    const retriedC = httpMock.expectOne('/api/c');
    expect(retriedA.request.headers.get('Authorization')).toBe('Bearer new-token');
    expect(retriedB.request.headers.get('Authorization')).toBe('Bearer new-token');
    expect(retriedC.request.headers.get('Authorization')).toBe('Bearer new-token');

    retriedA.flush({});
    retriedB.flush({});
    retriedC.flush({});
    tick();
  }));
});
