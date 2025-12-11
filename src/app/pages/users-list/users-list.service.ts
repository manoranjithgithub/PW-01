import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersListService {
  private userApiUrl = environment.usermanagementBaseUrl;
  private projectUrl = environment.projectsBaseUrl;

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getAllUSers() {
    return this.http.get(`${this.userApiUrl}/user/list-user`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  inviteNewUser(req: any) {
    return this.http.post(`${this.userApiUrl}/user/invite-user`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getPolicies() {
    return this.http.get(`${this.userApiUrl}/policies/org`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getAllProjects() {
    return this.http.get(`${this.projectUrl}/projects`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getEnvironmentsByProject(projectId: string) {
    return this.http.get(`${this.projectUrl}/environments?projectId=${projectId}`)
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
