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
  private apiUrl = environment.apiUrl;
  private legacyUrl = environment.legacyUrl;
  private deploymentManagement = environment.deploymentManagement;
  private userApiUrl = environment.usermanagementApiUrl;
  private jobExecutorUrl = environment.jobExecutorBaseUrl;
  private projectsBaseUrl = environment.projectsBaseUrl;

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getEnvironment() {
    return this.http.get(`${this.apiUrl}/`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  createEnvironment(req: any) {
    return this.http.post(`${this.legacyUrl}/environments`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentById(env: string, name: string) {
    return this.http.get(`${this.apiUrl}/${env}/deployments/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updateDeployment(deploymentId: string, req: any) {
    return this.http.put(`${this.deploymentManagement}/deployments/${deploymentId}`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updateResources(env: string, name: string, req: any) {
    return this.http.put(`${this.apiUrl}/${env}/deployments/${name}/resources`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updateEnvironmentVariables(env: string, name: string, req: any) {
    return this.http.put(`${this.apiUrl}/${env}/deployments/${name}/secret&config`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  restartDeployment(env: string, name: string, req: any) {
    return this.http.post(`${this.apiUrl}/${env}/deployments/${name}/rollout`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteDeployments(env: string, name: string) {
    return this.http.delete(`${this.apiUrl}/${env}/deployments/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentLogs(env: string, name: string, req: any) {
    const params = new HttpParams()
      .set('previous_logs', req);
    return this.http.get(`${this.apiUrl}/${env}/deployments/${name}/logs`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }


  getAccountInfo() {
    return this.http.get(`${this.userApiUrl}/v1/users/user`)
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
  getUserProfile(projectID: string, provider: string) {
    return this.http.get(`${this.deploymentManagement}/${provider}/${projectID}/userprofile`)
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

  integrateWithVCS(provider: string) {
    return this.http.get(`${this.deploymentManagement}/${provider}`)
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
