import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EndpointsService {
  private apiUrl = environment.apiUrl;

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getEndPoints(env: string) {
    return this.http.get(`${this.apiUrl}/${env}/endpoints`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getEndPointsById(env: string, id: string) {
    return this.http.get(`${this.apiUrl}/${env}/endpoints/${id}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getServiceList(env: any) {
    return this.http.get(`${this.apiUrl}/${env}/service`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  
  updateEndPointsById(env: string, id: string, req: any) {
    return this.http.put(`${this.apiUrl}/${env}/endpoints/${id}`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  createEndPoints(env: string, req: any) {
    return this.http.post(`${this.apiUrl}/${env}/endpoints`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getEnvironmentById(env: string) {
    return this.http.get(`${this.apiUrl}/${env}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  deleteEndPoints(env: string, name: string) {
    return this.http.delete(`${this.apiUrl}/${env}/endpoints/${name}`)
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
