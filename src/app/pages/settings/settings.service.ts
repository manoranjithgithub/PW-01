import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private apiUrl = environment.apiUrl;

    constructor(public http: HttpClient, private toastr: ToastrService) { }

    getServiceQuota(env: string,) {
        return this.http.get(`${this.apiUrl}/${env}/objectcount`)
            .pipe(
                catchError(this.handleError)
            );
    }

    getResourceQuota(env: string,) {
        return this.http.get(`${this.apiUrl}/${env}/quota/resources`)
            .pipe(
                catchError(this.handleError)
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
