import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private apiUrl = environment.apiUrl;
 

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getConfigList(env: string) {
    return this.http.get(`${this.apiUrl}/${env}/configs`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  
  createConfig(env: string, req: any) {
    return this.http.post(`${this.apiUrl}/${env}/configs`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  updateConfig(env: string, name: string, req: any) {
    return this.http.put(`${this.apiUrl}/${env}/configs/${name}`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getConfigByName(env: string, name: string) {
    return this.http.get(`${this.apiUrl}/${env}/configs/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      )
  }
  deleteConfigs(env: string, name: string) {
    return this.http.delete(`${this.apiUrl}/${env}/configs/${name}`)
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
