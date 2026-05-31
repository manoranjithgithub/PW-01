import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { SharedService } from '../../shared/services/shared.service';
import { HttpService } from './http-service.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let sharedSpy: jasmine.SpyObj<SharedService>;
  let httpSpy: jasmine.SpyObj<HttpService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sharedSpy = jasmine.createSpyObj('SharedService', ['setUser']);
    httpSpy = jasmine.createSpyObj('HttpService', ['getRefreshToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SharedService, useValue: sharedSpy },
        { provide: HttpService, useValue: httpSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    (environment as any).production = false;
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticated returns false when no token and true when present', () => {
    localStorage.removeItem('accessToken');
    expect(service.isAuthenticated()).toBeFalse();
    localStorage.setItem('accessToken', 'tok');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('setAccessToken calls processDecodedToken and emits ready', (done) => {
    const proc = spyOn<any>(service, 'processDecodedToken');
    service.tokenReady$.subscribe(v => {
      if (v) {
        expect(proc).toHaveBeenCalledWith('t');
        done();
      }
    });
    service.setAccessToken({ access_token: 't' } as any);
  });

  it('processDecodedToken prefers stored userInfo when available', () => {
    const stored = { avatar: 'a', name: 's' } as any;
    localStorage.setItem('userInfo', JSON.stringify(stored));
    const decoded = { properties: { nimbuzUserId: 'u1', nimbuzAccountId: 'a1' }, avatar: 'av', email: 'e', displayName: 'd', name: 'n', id: 'i', owner: false } as any;
    spyOn<any>(service, 'getDecodedAccessToken').and.returnValue(decoded);
    service.processDecodedToken('tok');
    expect(sharedSpy.setUser).toHaveBeenCalledWith(stored);
    expect(localStorage.getItem('userId')).toBe('u1');
  });

  it('processDecodedToken sets user when no stored userInfo', () => {
    localStorage.removeItem('userInfo');
    const decoded = { properties: {}, avatar: 'av', email: 'e@x', displayName: 'D', name: 'n', id: 'i', owner: true } as any;
    spyOn<any>(service, 'getDecodedAccessToken').and.returnValue(decoded);
    service.processDecodedToken('t');
    expect(sharedSpy.setUser).toHaveBeenCalled();
  });

  it('getClientInfo uses production domain for redirectUri when production=true', () => {
    spyOn<any>(service, 'getSubdomain').and.returnValue('app');
    (environment as any).production = true;
    const info = service.getClientInfo();
    expect(info.clientId).toBe('nimbuz');
    expect(info.redirectUri).toBe('https://app.nimbuz.tech');
  });

  it('getClientInfo returns subdomain clientId and dev redirectUri when not production', () => {
    spyOn<any>(service, 'getSubdomain').and.returnValue('acme');
    (environment as any).production = false;
    const info = service.getClientInfo();
    expect(info.clientId).toBe('acme');
    expect(info.redirectUri).toContain('.dev.nimbuz.tech');
  });

  it('getClientInfo returns localhost redirectUri when subdomain is localhost and not production', () => {
    spyOn<any>(service, 'getSubdomain').and.returnValue('localhost');
    (environment as any).production = false;
    const info = service.getClientInfo();
    expect(info.clientId).toBe('localhost');
    expect(info.redirectUri).toBe('http://localhost:4200');
  });

  it('getTokenExpirationDate returns null for invalid token and logs', () => {
    const spy = spyOn(console, 'error');
    const res = service.getTokenExpirationDate('bad');
    expect(res).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('getTokenExpirationDate and isTokenExpired behave for future token', () => {
    const exp = Math.floor(Date.now() / 1000) + 120;
    const payload = { exp };
    const b64 = (obj: any) => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
    const d = service.getTokenExpirationDate(token);
    expect(d).toBeTruthy();
    expect(service.isTokenExpired(token)).toBeFalse();
  });

  it('getDecodedAccessToken returns null for malformed token', () => {
    expect(service.getDecodedAccessToken('not.a.jwt')).toBeNull();
  });

  it('getRefreshToken reads refresh_token and refreshToken calls http', () => {
    localStorage.setItem('refresh_token', 'r1');
    httpSpy.getRefreshToken.and.returnValue(of({ success: true }));
    spyOn<any>(service, 'getRefreshToken').and.returnValue('r1');
    const sub = window.location.hostname.split('.')[0];
    const expectedState = sub === 'app' ? 'nimbuz' : sub;
    service.refreshToken().subscribe(() => {
      expect(httpSpy.getRefreshToken).toHaveBeenCalledWith(jasmine.objectContaining({ state: expectedState, refreshToken: 'r1' }));
    });
  });

  it('refreshToken propagates http errors', (done) => {
    localStorage.setItem('refresh_token', 'r1');
    httpSpy.getRefreshToken.and.returnValue(throwError(() => new Error('fail')));

    service.refreshToken().subscribe({
      next: () => fail('should not succeed'),
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      }
    });
  });

  it('setAccessToken with null still emits tokenReady', (done) => {
    service.tokenReady$.subscribe(v => {
      if (v) { done(); }
    });
    service.setAccessToken(null as any);
  });

  it('processDecodedToken does nothing when token cannot be decoded', () => {
    spyOn<any>(service, 'getDecodedAccessToken').and.returnValue(null);
    service.processDecodedToken('bad-token');
    expect(sharedSpy.setUser).not.toHaveBeenCalled();
  });

  it('refreshToken forwards null when no refresh_token present', () => {
    localStorage.removeItem('refresh_token');
    httpSpy.getRefreshToken.and.returnValue(of({ success: true }));
    service.refreshToken().subscribe(() => {
      const sub = window.location.hostname.split('.')[0];
      const expectedState = sub === 'app' ? 'nimbuz' : sub;
      expect(httpSpy.getRefreshToken).toHaveBeenCalledWith(jasmine.objectContaining({ state: expectedState, refreshToken: null }));
    });
  });

  it('logout clears storage and navigates to login', () => {
    localStorage.setItem('accessToken', 'x');
    sessionStorage.setItem('s', '1');
    document.cookie = 'a=1';
    service.logout();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.length).toBe(0);
    expect(TestBed.inject(Router)!.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('isTokenReady processes token when present and returns true', () => {
    const token = 't.present';
    localStorage.setItem('accessToken', token);
    const proc = spyOn<any>(service, 'processDecodedToken');
    expect(service.isTokenReady()).toBeTrue();
    expect(proc).toHaveBeenCalledWith(token);
  });

  it('isTokenExpired returns true for past token', () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    const payload = { exp };
    const b64 = (obj: any) => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
    expect(service.isTokenExpired(token)).toBeTrue();
  });

  it('login navigates to /login', () => {
    service.login();
    expect(TestBed.inject(Router)!.navigate).toHaveBeenCalledWith(['/login']);
  });
});
