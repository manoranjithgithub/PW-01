import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { SharedService } from '../../shared/services/shared.service';
import { of, throwError } from 'rxjs';

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

    expect(loaderSpy.show).toHaveBeenCalled();

    const req = httpMock.expectOne('/api/test');
    req.flush({});

    tick(200);
    expect(loaderSpy.hide).toHaveBeenCalled();
  }));

  it('should skip loader for skipLoaderUrls', fakeAsync(() => {
    http.get('/artificat?fileExtension=zip').subscribe();

    const req = httpMock.expectOne('/artificat?fileExtension=zip');
    req.flush({});

    tick(200);
    expect(loaderSpy.show).not.toHaveBeenCalled();
    expect(loaderSpy.hide).not.toHaveBeenCalled();
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

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Invalid input',
      'Validation Error'
    );
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
      authSpy.refreshToken.and.returnValue(
        of({ access_token: 'new-token' })
      );

      http.get('/api/test').subscribe();

      const req1 = httpMock.expectOne('/api/test');
      req1.flush({}, { status: 401, statusText: 'Unauthorized' });

      const retryReq = httpMock.expectOne('/api/test');
      expect(retryReq.request.headers.get('Authorization')).toBe(
        'Bearer new-token'
      );

      retryReq.flush({});
      tick();
    }));

    it('should logout and redirect if refresh fails', fakeAsync(() => {
      authSpy.getAccessToken.and.returnValue('old-token');
      authSpy.isTokenExpired.and.returnValue(true);
      authSpy.refreshToken.and.returnValue(
        throwError(() => new Error('refresh failed'))
      );

      http.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(authSpy.logout).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));
  });
});
