// my-http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class HttpService {

  private loginUrl = environment.loginUrl;
  private userManagement = environment.usermanagementBaseUrl;

  constructor(private http: HttpClient) { }

  get(apiUrl: string): Observable<any> {
    return this.http.get<any>(apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  post(data: any): Observable<any> {
    return this.http.post<any>(`${this.loginUrl}`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRefreshToken(data: any): Observable<any> {
    return this.http.post<any>(`${this.userManagement}/users`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }
}
