import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  switchMap,
  take
} from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { SharedService } from '../../shared/services/shared.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  private readonly skipLoaderUrls = [
    '/status',
    '/deployments?',
    '/artificat?fileExtension',
  ];

  constructor(
    private loader: SharedService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skipLoader = this.shouldSkipLoader(req.url);
    if (!skipLoader) this.loader.show();
    if (req.url.includes('/user-uploads')) {
      return next.handle(req).pipe(finalize(() => !skipLoader && this.loader.hide()));
    }
    const token = this.authService.getAccessToken();
    const request = token ? this.addToken(req, token) : req;
    return next.handle(request).pipe(
      catchError(error => this.handleError(error, request, next)),
      finalize(() => {
        if (!skipLoader) this.loader.hide();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
    );
  }

  private shouldSkipLoader(url: string): boolean {
    return this.skipLoaderUrls.some(pattern => url.includes(pattern));
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handleError(error: HttpErrorResponse, request: HttpRequest<any>, next: HttpHandler) {
    const status = error.status;
    switch (status) {
      case 401:
        return this.handle401(request, next);
      case 400:
        this.handle400(error);
        break;
      case 404:
        this.toastr.error(error.error?.error?.details || 'Resource not found', '404');
        break;
      case 500: {
        const msg = this.extractErrorMessage(error) || 'Internal server error';
        this.toastr.error(msg, '500');
        break;
      }
      default:
        console.error('Unhandled error:', this.extractErrorMessage(error));
        break;
    }
    return throwError(() => error);
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    return (
      error.error?.error?.details ||
      error.error?.error?.message ||
      error.error?.message ||
      error.message ||
      ''
    );
  }

  private handle400(error: HttpErrorResponse) {
    const err = error.error;
    if (Array.isArray(err?.details)) {
      err.details.forEach((detail: string) =>
        this.toastr.error(detail.replace(/"/g, ''), 'Validation Error')
      );
      return;
    }
    if (err?.customError && err?.response?.error?.message) {
      this.toastr.error(err.response.error.message);
      return;
    }
    const message = (err?.error?.message || err?.error || '').replace(/"/g, '');
    if (message) {
      this.toastr.error(message, 'Error');
    }
  }

  private handle401(request: HttpRequest<any>, next: HttpHandler) {
    const token = this.authService.getAccessToken();
    if (!token || !this.authService.isTokenExpired(token)) {
      this.authService.logout();
      return throwError(() => new Error('Unauthorized'));
    }
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      return this.authService.refreshToken().pipe(
        switchMap((tokenData: any) => {
          this.isRefreshing = false;
          const newToken = tokenData.access_token;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token!)))
      );
    }
  }
}
