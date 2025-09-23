import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecretsService {
  private apiUrl = environment.apiUrl;

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getSecretsList(env: string) {
    return this.http.get(`${this.apiUrl}/${env}/secrets`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  createSecret(env: string, req: any) {
    return this.http.post(`${this.apiUrl}/${env}/secrets`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  updateSecret(env: string, name: string, req: any) {
    return this.http.put(`${this.apiUrl}/${env}/secrets/${name}`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  
  getSecretByName(env: string, name: string) {
    return this.http.get(`${this.apiUrl}/${env}/secrets/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteSecret(env: string, name: string) {
    return this.http.delete(`${this.apiUrl}/${env}/secrets/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      this.toastr.error(error.error?.error)
    } else {
      const errorMessage = error.error?.error || 'Please try again later';
      //this.toastr.error(errorMessage, 'Error');
      console.error(errorMessage);
    }

    return throwError('Something bad happened; please try again later.');
  }
}
