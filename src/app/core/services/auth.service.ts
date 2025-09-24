import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { SharedService } from '../../shared/services/shared.service';
import { HttpService } from './http-service.service';
import { environment } from '../../../environments/environment';


interface JwtPayload {
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private tokenReadySubject = new BehaviorSubject<boolean>(false);
  tokenReady$ = this.tokenReadySubject.asObservable();

  constructor(private router: Router,
    private sharedService: SharedService, private http: HttpService
  ) { }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!localStorage.getItem('accessToken');
  }

  login() {
    this.router.navigate(['/login']);
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    this.router.navigate(['/login']);
  }
  setAccessToken(token: any) {
    // localStorage.setItem('accessToken', token.access_token);
    // localStorage.setItem('refresh_token', token.refresh_token);
    // this.sharedService.setCookie('refresh_token', token.refresh_token, 10);
    if (token) {
      this.processDecodedToken(token.access_token);
    }
    this.tokenReadySubject.next(true);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isTokenReady(): boolean {
    const token = this.getAccessToken();
    if (token) {
      this.processDecodedToken(token);
    }
    return !!token;
  }

  public processDecodedToken(token: string): void {
    const decodeData = this.getDecodedAccessToken(token);
    if (decodeData) {
      localStorage.setItem('userId', decodeData?.properties?.nimbuzUserId || '');

      const userInfo = {
        avatar: decodeData.avatar,
        email: decodeData.email,
        name: decodeData.displayName,
        userName: decodeData.name,
        id: decodeData.id,
        owner: decodeData.owner
      };
      localStorage.setItem('profileSettings', JSON.stringify(userInfo));
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        const existingUserInfo = JSON.parse(storedUserInfo);
        this.sharedService.setUser(existingUserInfo);
      } else {
        this.sharedService.setUser(userInfo);
      }
    }
  }
  public getClientInfo(): { clientId: string; state: string; redirectUri: string } {
    const subdomain = this.getSubdomain();
    const isIndividual = subdomain === 'app';
    const clientId = isIndividual ? 'nimbuz' : subdomain;
    const state = clientId;
    // const redirectUri = `http://localhost:4200`;
    const redirectUri = environment.production
      ? `https://${subdomain}.nimbuz.tech`
      : `https://${subdomain}.dev.nimbuz.tech`;
    return { clientId, state, redirectUri };
  }

  private getSubdomain(): string {
    const hostname = window.location.hostname;
    return hostname.split('.')[0];
  }

  private base64UrlDecode(base64Url: string): string {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    try {
      return decodeURIComponent(escape(decoded));
    } catch (e) {
      return decoded;
    }
  }

  getTokenExpirationDate(token: string): Date | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');
      const decoded = JSON.parse(this.base64UrlDecode(parts[1]));
      if (!decoded.exp) return null;

      const date = new Date(0);
      date.setUTCSeconds(decoded.exp);
      return date;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const expirationDate = this.getTokenExpirationDate(token);
    if (!expirationDate) {
      return true;
    }

    return expirationDate < new Date();
  }
  getDecodedAccessToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (Error) {
      return null;
    }
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }
  refreshToken(): Observable<any> {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    const state = (subdomain === 'app') ? 'nimbuz' : subdomain;
    const req = {
      state: state,
      refreshToken: this.getRefreshToken()
    };
    return this.http.getRefreshToken(req);
  }
}
