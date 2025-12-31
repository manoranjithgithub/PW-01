import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [UserService] });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should register user', () => {
    const payload = { email: 'a' } as any;
    service.register(payload).subscribe();
    const req = httpMock.expectOne(`${environment.baseUrl}/user/v1/user/register`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should login user', () => {
    const payload = { email: 'a' } as any;
    service.login(payload).subscribe();
    const req = httpMock.expectOne(`${environment.baseUrl}/user/v1/user/login`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should reset password with Authorization header when token present', () => {
    localStorage.setItem('accessToken', 't1');
    const payload = { password: 'p' } as any;
    service.resetPassword(payload).subscribe({ error: () => {} });
    const req = httpMock.expectOne(`${environment.baseUrl}/user/v1/user/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    req.flush({});
  });

  it('should reset password without Authorization header when no token present', () => {
    localStorage.removeItem('accessToken');
    const payload = { password: 'p' } as any;
    service.resetPassword(payload).subscribe({ error: () => {} });
    const req = httpMock.expectOne(`${environment.baseUrl}/user/v1/user/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('resetPassword should log and propagate error on failure', (done) => {
    spyOn(console, 'error');
    localStorage.setItem('accessToken', 't1');
    const payload = { password: 'p' } as any;
    service.resetPassword(payload).subscribe({
      next: () => {},
      error: (err) => {
        expect(console.error).toHaveBeenCalled();
        expect(err).toBeTruthy();
        done();
      }
    });
    const req = httpMock.expectOne(`${environment.baseUrl}/user/v1/user/reset-password`);
    req.flush('error', { status: 500, statusText: 'Server Error' });
  });

  it('resetPassword propagates 404 not found errors', (done) => {
    const payload = { password: 'p' } as any;
    service.resetPassword(payload).subscribe({
      next: () => {},
      error: (err) => {
        expect(err.status).toBe(404);
        done();
      }
    });
    const req = httpMock.expectOne(`${environment.baseUrl}/user/v1/user/reset-password`);
    req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });
  });
});
