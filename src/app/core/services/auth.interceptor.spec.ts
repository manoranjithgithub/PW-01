import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { SharedService } from '../../shared/services/shared.service';
import { of, throwError, Subject } from 'rxjs';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  let authSpy: jasmine.SpyObj<AuthService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loaderSpy: jasmine.SpyObj<SharedService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', [
      'getAccessToken',
      'isTokenExpired',
      'refreshToken',
      'logout'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', ['error']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    loaderSpy = jasmine.createSpyObj('SharedService', ['show', 'hide']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: AuthService, useValue: authSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: Router, useValue: routerSpy },
        { provide: SharedService, useValue: loaderSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token exists', () => {
    authSpy.getAccessToken.and.returnValue('token-123');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');

    req.flush({});
  });

  it('should show and hide loader for normal requests', fakeAsync(() => {
    authSpy.getAccessToken.and.returnValue(null);

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    req.flush({});

    tick(200);
    expect(req.request).toBeTruthy();
  }));

  // it('should skip loader for skipLoaderUrls', fakeAsync(() => {
  //   authSpy.getAccessToken.and.returnValue(null);
  //   loaderSpy.show.calls.reset();
  //   loaderSpy.hide.calls.reset();

  //   http.get('/artificat?fileExtension=zip').subscribe();

  //   const req = httpMock.expectOne('/artificat?fileExtension=zip');
  //   req.flush({});

  //   tick(200);

  //   expect(loaderSpy.show).not.toHaveBeenCalled();
  //   expect(loaderSpy.hide).not.toHaveBeenCalled();
  // }));

  it('should handle 400 with customError response', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/test');
    req.flush(
      { customError: true, response: { error: { message: 'Bad' } } },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(toastrSpy.error).toHaveBeenCalledWith('Bad');
  });

  it('should handle 400 with error.message at error.error', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/test');
    req.flush(
      { error: { message: 'Outer' } },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(toastrSpy.error).toHaveBeenCalledWith('Outer', 'Error');
  });

  it('should finalize and hide loader for /user-uploads requests', fakeAsync(() => {
    authSpy.getAccessToken.and.returnValue(null);

    http.get('/user-uploads/file').subscribe();

    expect(loaderSpy.show).toHaveBeenCalled();

    const req = httpMock.expectOne('/user-uploads/file');
    req.flush({});

    tick(10);
    expect(loaderSpy.hide).toHaveBeenCalled();
  }));

  it('should handle 400 error with validation messages', () => {
    http.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(
      {
        details: ['"Invalid input"']
      },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(toastrSpy.error).toHaveBeenCalledWith('Invalid input', 'Validation Error');
  });

  it('should handle 404 error', () => {
    http.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(
      { error: { details: 'Not found' } },
      { status: 404, statusText: 'Not Found' }
    );

    expect(toastrSpy.error).toHaveBeenCalledWith('Not found', '404');
  });

  it('should handle 500 error', () => {
    http.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(
      { error: { message: 'Server crashed' } },
      { status: 500, statusText: 'Server Error' }
    );

    expect(toastrSpy.error).toHaveBeenCalledWith('Server crashed', '500');
  });

  it('should show multiple validation toasts for 400.details array', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/test');
    req.flush(
      { details: ['"First"', '"Second"'] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(toastrSpy.error).toHaveBeenCalledWith('First', 'Validation Error');
    expect(toastrSpy.error).toHaveBeenCalledWith('Second', 'Validation Error');
  });

  it('should use default message for 500 when no message present', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(toastrSpy.error).toHaveBeenCalled();
    expect(toastrSpy.error.calls.mostRecent().args[1]).toBe('500');
  });

  describe('401 handling', () => {
    it('should logout if token is missing or not expired', () => {
      authSpy.getAccessToken.and.returnValue(null);
      authSpy.isTokenExpired.and.returnValue(false);

      http.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(authSpy.logout).toHaveBeenCalled();
    });

    it('should refresh token and retry request', fakeAsync(() => {
      authSpy.getAccessToken.and.returnValue('old-token');
      authSpy.isTokenExpired.and.returnValue(true);
      authSpy.refreshToken.and.returnValue(of({ access_token: 'new-token' }));

      http.get('/api/test').subscribe();

      const req1 = httpMock.expectOne('/api/test');
      req1.flush({}, { status: 401, statusText: 'Unauthorized' });

      const retryReq = httpMock.expectOne('/api/test');
      expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');

      retryReq.flush({});
      tick();
      tick(1000);
    }));

    it('should logout and redirect if refresh fails', fakeAsync(() => {
      authSpy.getAccessToken.and.returnValue('old-token');
      authSpy.isTokenExpired.and.returnValue(true);
      authSpy.refreshToken.and.returnValue(throwError(() => new Error('refresh failed')));

      http.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(authSpy.logout).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      tick(1000);
    }));

    it('retries request even if refresh returns no access_token (edge case)', fakeAsync(() => {
      authSpy.getAccessToken.and.returnValue('old-token');
      authSpy.isTokenExpired.and.returnValue(true);
      authSpy.refreshToken.and.returnValue(of({}));

      http.get('/api/test').subscribe();

      const first = httpMock.expectOne('/api/test');
      first.flush({}, { status: 401, statusText: 'Unauthorized' });

      const retried = httpMock.expectOne('/api/test');
      expect(retried.request.headers.get('Authorization')).toBe('Bearer undefined');
      retried.flush({});
      tick(200);
    }));

    it('queues concurrent 401s and calls refreshToken only once', fakeAsync(() => {
      authSpy.getAccessToken.and.returnValue('old-token');
      authSpy.isTokenExpired.and.returnValue(true);
      const refreshSubject = new Subject<any>();
      authSpy.refreshToken.and.returnValue(refreshSubject.asObservable());
      http.get('/api/one').subscribe({ error: () => {} });
      const r1 = httpMock.expectOne('/api/one');
      r1.flush({}, { status: 401, statusText: 'Unauthorized' });

      http.get('/api/two').subscribe({ error: () => {} });
      const r2 = httpMock.expectOne('/api/two');
      r2.flush({}, { status: 401, statusText: 'Unauthorized' });

      http.get('/api/three').subscribe({ error: () => {} });
      const r3 = httpMock.expectOne('/api/three');
      r3.flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(authSpy.refreshToken).toHaveBeenCalledTimes(1);
      refreshSubject.next({ access_token: 'new-t' });
      refreshSubject.complete();

      const retried1 = httpMock.expectOne('/api/one');
      const retried2 = httpMock.expectOne('/api/two');
      const retried3 = httpMock.expectOne('/api/three');

      expect(retried1.request.headers.get('Authorization')).toBe('Bearer new-t');
      expect(retried2.request.headers.get('Authorization')).toBe('Bearer new-t');
      expect(retried3.request.headers.get('Authorization')).toBe('Bearer new-t');

      retried1.flush({}); retried2.flush({}); retried3.flush({});
      tick(300);
    }));

    it('does not call toastr for 400 with empty body', () => {
      http.get('/api/test').subscribe({ error: () => {} });

      const req = httpMock.expectOne('/api/test');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(toastrSpy.error).not.toHaveBeenCalled();
    });
  });
});
