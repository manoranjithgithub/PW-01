import { Injectable } from '@angular/core';
import Casdoor from 'casdoor-js-sdk';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpService } from './http-service.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CasdoorService {
  private casdoor: Casdoor;
  private config = environment.casdoorConfig;
  private loginUrl = environment.loginUrl;

  constructor(private http: HttpService) {
    this.casdoor = new Casdoor(this.config);

  }

  getLoginUrl(): string {
    return this.casdoor.getSigninUrl();
  }
  // geAccesssToken(code: number) {
  //   return this.http.post(code);
  // }
  getCasdoorToken(code: any, state: string) {
    return this.http.get(`${this.loginUrl}/user-management/v1/users/api/signin?code=${code}&state=${state}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  async handleCallback(code: string) {
    const tokenResponse = await this.casdoor.refreshAccessToken(code);
    const token = tokenResponse.access_token
    sessionStorage.setItem('casdoor_token', token);
  }
  async getUserInfo() {
    const token = sessionStorage.getItem('casdoor_token');
    if (!token) return null;
    return this.casdoor.getUserInfo(token);
  }

  logout() {
    sessionStorage.removeItem('casdoor_token');
  }
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      // this.toastr.error(error.error?.error)
    } else {
      // console.error(
      //   `Backend returned code ${error.status}, ` +
      //   `body was: ${JSON.stringify(error.error)}`);
      const errorMessage = error.error?.error || 'Please try again later';
      // this.toastr.error(errorMessage, 'Error');
    }

    return throwError('Something bad happened; please try again later.');
  }
}
