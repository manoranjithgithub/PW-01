import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VolumesService {

  private apiUrl = environment.apiUrl;

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getVolumeByName(env: string, name: string) {
    return this.http.get(`${this.apiUrl}/${env}/volume/${name}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVolumesList(env: string) {
    return this.http.get(`${this.apiUrl}/${env}/volume`)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteVolumes(env: string, name: string) {
    return this.http.delete(`${this.apiUrl}/${env}/volume/${name}`)
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
