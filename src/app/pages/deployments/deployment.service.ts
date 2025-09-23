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
  private pricingManagement = environment.pricingManagement;
  private deploymentManagement = environment.deploymentManagement;
  private jobExecutorUrl = environment.jobExecutorBaseUrl;
  private logServiceUrl = environment.logServiceUrl;
  private projectsBaseUrl = environment.projectsBaseUrl;

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getDefualtConfigInfo() {
    return this.http.get(`${this.deploymentManagement}/deploymentSettings`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getInstanceTypes() {
    return this.http.get(`${this.deploymentManagement}/instanceTypes`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  integrateWithGitHub() {
    return this.http.get(`${this.deploymentManagement}/github`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  integrateWithGitLab() {
    return this.http.get(`${this.deploymentManagement}/gitlab`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getCallback(auth_code: string, projectID: string) {
    const params = new HttpParams()
      .set('code', auth_code);
    return this.http.get(`${this.deploymentManagement}/github/${projectID}/callback`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getGitLabCallback(auth_code: string, projectID: string) {
    const params = new HttpParams()
      .set('code', auth_code);
    return this.http.get(`${this.deploymentManagement}/gitlab/${projectID}/callback`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getGitLabUserRepos(projectID: string) {
    return this.http.get(`${this.deploymentManagement}/gitlab/${projectID}/repos`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getGitLabUserProfile(projectID: string) {
    return this.http.get(`${this.deploymentManagement}/gitlab/${projectID}/userprofile`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeployments() {
    return this.http.get(`${this.deploymentManagement}/deployments`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentById(deploymentId: string) {
    return this.http.get(`${this.deploymentManagement}/deployments/${deploymentId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getUserRepos(projectID: string) {
    return this.http.get(`${this.deploymentManagement}/github/${projectID}/repos`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getAvailableRepos(provider: string, projectId: string) {
    return this.http.get(`${this.projectsBaseUrl}/integrations/vcs/resources?provider=${provider}&projectId=${projectId}&type=repositories`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getUserProfile(projectID: string) {
    return this.http.get(`${this.deploymentManagement}/github/${projectID}/userprofile`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getGitLabbranch(repoId: any, projectID: string) {
    return this.http.get(`${this.deploymentManagement}/gitlab/${projectID}/repos/${repoId}/branches`)
  }

  getGitHubBranch(full_name: any, projectID: string) {
    return this.http.get(`${this.deploymentManagement}/github/${projectID}/repos/${full_name}/branches`)
  }

  getReleasesByDeploymentId(deploymentId: string) {
    const params = new HttpParams()
      .set('deploymentId', deploymentId);
    return this.http.get(`${this.deploymentManagement}/releases`, { params })
  }

  createDeployement(req: any) {
    return this.http.post(`${this.deploymentManagement}/deployments/`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  uploadZipDeployment(envId: string, req: any) {
    return this.http.post(`${this.deploymentManagement}/environments/${envId}/deployments/upload`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteDeployment(deploymentId: string) {
    return this.http.delete(`${this.deploymentManagement}/deployment/${deploymentId}`)
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

  viewDeploymentLogs(releaseId: string) {
    const params = new HttpParams()
      .set('id', releaseId);
    return this.http.get(`${this.jobExecutorUrl}/logs`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getDeploymentLogs(releaseId: string, logType: string, page: number, pageSize: number) {
    return this.http.get(`${this.deploymentManagement}/releases/${releaseId}/logs?logType=${logType}&page=${page}&limit=${pageSize}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getApplicationLogs(
    deploymentId: string, page: number = 1, pageSize: number = 300, duration?: string, fromTimestamp?: string, toTimestamp?: string, keyword?: string,
  ) {
    let params = new HttpParams();

    if (duration) {
      params = params.set('timeRange', duration);
    }
    if (fromTimestamp) {
      params = params.set('fromTimestamp', fromTimestamp);
    }
    if (toTimestamp) {
      params = params.set('toTimestamp', toTimestamp);
    }
    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get(`${this.deploymentManagement}/deployment/${deploymentId}/logs?page=${page}&limit=${pageSize}`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentResourceAllocation(deploymentId?: string) {
    let params = new HttpParams();
    if (deploymentId) {
      params = params.set('deploymentId', deploymentId);
    }
    return this.http.get(`${this.deploymentManagement}/deployment/getResourceAllocationDetails`, { params })
      .pipe(catchError(this.handleError));
  }

  getConfigList(env: string, name: string) {
    return this.http.get(`${this.deploymentManagement}/${env}/configs/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getSecreteList(env: string, name: string) {
    return this.http.get(`${this.deploymentManagement}/${env}/secrets/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  createConfigdata(env: string, req: any) {
    return this.http.post(`${this.deploymentManagement}/${env}/configs`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  createSecretsdata(env: string, req: any) {
    return this.http.post(`${this.deploymentManagement}/${env}/secrets`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  checkDeployNameAvailability(env: string, name: string) {
    return this.http.get(`${this.deploymentManagement}/environments/${env}/deployments/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  uploadConfigFile(env: string, req: any) {
    return this.http.post(`${this.deploymentManagement}/${env}/configs/upload`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  createEndpoint(env: string, req: any) {
    return this.http.post(`${this.deploymentManagement}/${env}/endpoint`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentStatus(env: string) {
    return this.http.get(`${this.deploymentManagement}/environments/${env}/deployments/status`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentMetrics(req: any) {
    return this.http.post(`${this.pricingManagement}/metrics`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getPodsByDeploymentId(deploymentId: string) {
    return this.http.get(`${this.deploymentManagement}/deployment/${deploymentId}/getPodsByDeployment`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getAuthenticatedresponse(env: string, deploymentId: string) {
    return this.http.get(`${this.deploymentManagement}/${env}/endpoint/${deploymentId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteEndpoint(env: string, name: string) {
    return this.http.delete(`${this.deploymentManagement}/${env}/endpoint/${name}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getSelectedDeploymentLogs(req: any) {
    return this.http.post(`${this.logServiceUrl}/v1/logs`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }


  getVCSCallback(auth_code: string, projectID: string, provider: string) {
    const req = {
      projectId: projectID,
      provider: provider
    }
    return this.http.post(`${this.projectsBaseUrl}/integrations/vcs/oauth/callback?code=${auth_code}`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getAvailableBranches(projectID: string, provider: string, repoId: string) {
    let url = `${this.projectsBaseUrl}/integrations/vcs/resources?provider=${provider}&projectId=${projectID}&type=branches`;
    if (provider === 'gitlab') {
      url += `&repoId=${repoId}`;
    }
    if (provider === 'github') {
      url += `&repoName=${repoId}`;
    }
    return this.http.get(url).pipe(
      catchError(this.handleError.bind(this))
    );
  }


  getS3Details() {
    return this.http.get(`${this.deploymentManagement}/artificat?fileExtension=zip`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  uploadZipFile(url: string, file: any, contentType: string) {
    return this.http.put(url, file, {
      headers: { 'Content-Type': contentType }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Something went wrong. Please try again later.';

    if (error.error) {
      if (error.error.error?.details) {
        errorMessage = error.error.error.details;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    }

    // this.toastr.error(errorMessage, 'Error');
    // console.error('API Error:', errorMessage);

    return throwError(() => new Error(errorMessage));
  }


}
