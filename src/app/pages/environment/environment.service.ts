import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private apiUrl = environment.projectsApiUrl;

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  createEnvironment(projectId: string, req: any){
    return this.http.post(`${this.apiUrl}/${projectId}/environments`, req)
    .pipe(
      catchError(this.handleError.bind(this))
    );
  }

  updateEnvironment(projectId: string, envId: string, req: any) {
    return this.http.put(`${this.apiUrl}/${projectId}/environments/${envId}`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteEnvironment(projectId: string, envId: string) {
    return this.http.delete(`${this.apiUrl}/${projectId}/environments/${envId}`)
    //return this.http.delete(`https://e7d27103-7e26-4c37-8b1f-b3dcd1d1b2aa.mock.pstmn.io/project-management/v1/projects/d5492734-616e-4715-b891-ac6a71b8e945/environments/env-7ztr94`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getEnvironmentsByProject(projectId: string) {
    return this.http.get(`${this.apiUrl}/${projectId}/environments`)
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
