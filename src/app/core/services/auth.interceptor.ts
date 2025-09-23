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
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private loaderService: SharedService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url;
    const skipLoaderUrls = ['/status'];
    const skipLoader = skipLoaderUrls.some(pattern => url.includes(pattern));
    if (!skipLoader) {
      this.loaderService.show();
    }

    const token = this.authService.getAccessToken();
    let request = req;

    if (token) {
      request = this.addToken(req, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          const currentToken = this.authService.getAccessToken();

          if (currentToken && this.authService.isTokenExpired(currentToken)) {
            return this.handle401Error(request, next);
          } else {
            this.authService.logout();
            return throwError(() => error);
          }
        } else if (error.status === 500 && error.error?.error?.details) {
          const message = error.error.error.details;
          this.toastr.error(message, 'Internal Server Error 500:');
        } else if (error.status === 404 && error.error?.error?.details) {
          const message = error.error.error.details;
          this.toastr.error(message, 'Internal Server Error 404:');
        } else if (error.status === 400) {
          if (error.error.customError && error.error?.response) {
            const message = error.error.response.error.message;
            this.toastr.error(message, message);
          } else {
            const message = error.error?.message || 'Bad Request';
            this.toastr.error(message, message);
          }
        } else {
          const message = error.error?.error || 'Please try again later';
          console.error('Unhandled error:', message);
        }

        return throwError(() => error);
      }),
      finalize(() => {
        if (!skipLoader) {
          this.loaderService.hide();
        }
      })
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((tokenData: any) => {
          this.isRefreshing = false;
          const newAccessToken = tokenData.access_token;
          // this.authService.setAccessToken(tokenData);
          this.refreshTokenSubject.next(newAccessToken);
          return next.handle(this.addToken(request, newAccessToken));
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
        switchMap((token) => next.handle(this.addToken(request, token!)))
      );
    }
  }
}
