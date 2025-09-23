// token.interceptor.ts
import { Injectable } from '@angular/core';
import {
    HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject = new BehaviorSubject<string | null>(null);

    constructor(private authService: AuthService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const accessToken = this.authService.getAccessToken();

        let clonedReq = req;
        if (accessToken) {
            clonedReq = this.addToken(req, accessToken);
        }

        return next.handle(clonedReq).pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    return this.handle401Error(req, next);
                }
                return throwError(() => error);
            })
        );
    }

    private addToken(req: HttpRequest<any>, token: string) {
        return req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
    }

    private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap((tokens: any) => {
                    this.isRefreshing = false;
                    // this.authService.setAccessToken(tokens);
                    this.refreshTokenSubject.next(tokens.access_token);
                    return next.handle(this.addToken(req, tokens.access_token));
                }),
                catchError(err => {
                    this.isRefreshing = false;
                    this.authService.logout();
                    return throwError(() => err);
                })
            );
        } else {
            return this.refreshTokenSubject.pipe(
                filter(token => token != null),
                take(1),
                switchMap((token) => next.handle(this.addToken(req, token!)))
            );
        }
    }
}
