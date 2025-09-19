import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountSettingsService {
  private userApiUrl = environment.usermanagementApiUrl;

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getAccountInfo() {
    return this.http.get(`${this.userApiUrl}/v1/users/user`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updateAccountInfo(req: any) {
    return this.http.put(`${this.userApiUrl}/v1/users/update`, req)
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
