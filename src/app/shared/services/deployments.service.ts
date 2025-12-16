import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeploymentsService {
  private deploymentManagement = environment.deploymentManagement;
  private jobExecutorUrl = environment.jobExecutorBaseUrl;
  private projectsBaseUrl = environment.projectsBaseUrl;
  private userApiUrl = environment.usermanagementBaseUrl

  constructor(public http: HttpClient, private toastr: ToastrService) { }
  updateDeployment(deploymentId: string, req: any) {
    return this.http.put(`${this.deploymentManagement}/deployments/${deploymentId}`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  deleteTools(env: string, name: string) {
    return this.http.delete(`${this.deploymentManagement}/tools`, { body: { environmentId: env, name } })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  disconnectProfile(projectID: string, provider: string) {
    return this.http.delete(`${this.projectsBaseUrl}/integrations/vcs?projectId=${projectID}&provider=${provider}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getIntegrationStatus(projectID: string, provider: string) {
    return this.http.get(`${this.projectsBaseUrl}/integrations/vcs?projectId=${projectID}&provider=${provider}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getDeploymentViewLogs(releaseId: string, logType: string) {
    return this.http.get(`${this.jobExecutorUrl}/releases/${releaseId}/logs?logType=${logType}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getReleasesViewByDeploymentId(deploymentId: string) {
    const params = new HttpParams()
      .set('deploymentId', deploymentId);
    return this.http.get(`${this.jobExecutorUrl}/releases`, { params })
  }

  getPolicies() {
    return this.http.get(`${this.userApiUrl}/policies/org`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getPolicyByUser() {
    const headers = { 'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'authorization': `Bearer ${localStorage.getItem('accessToken')}`
     };
    return this.http.get(`${this.userApiUrl}/policies`, { headers })
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
      console.error(errorMessage);
    }

    return throwError('Something bad happened; please try again later.');
  }
}
