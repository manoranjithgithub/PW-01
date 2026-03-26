import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared/services/shared.service';
import { createSSEObservable } from '../../shared/utils/sse.utils';

@Injectable({
  providedIn: 'root'
})
export class DeploymentsService {
  private pricingManagement = environment.pricingManagement;
  private deploymentManagement = environment.deploymentManagement;
  private logServiceUrl = environment.logServiceUrl;
  private projectsBaseUrl = environment.projectsBaseUrl;
  private metricsApiUrl = environment.metricsUrl;

  constructor(public http: HttpClient, private loaderService: SharedService, private zone: NgZone) { }

  getInstanceTypes() {
    return this.http.get(`${this.pricingManagement}/public/pricing-catalog`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeployments(envId: string) {
    return this.http.get(`${this.deploymentManagement}/deployments?environmentId=${envId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentById(deploymentId: string) {
    const envId = JSON.parse(localStorage.getItem('environment') || '{}').id;
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;

    return this.http.get(`${this.deploymentManagement}/deployments?deploymentId=${deploymentId}&environmentId=${envId}&projectId=${projectId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getReleaseDataById(releaseId: string) {
    return this.http.get(`${this.deploymentManagement}/releases/${releaseId}`)
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

  getReleasesByDeploymentId(deploymentId: string) {
    return this.http.get(`${this.deploymentManagement}/deployments/${deploymentId}/releases`)
  }

  createDeployement(req: any) {
    const envId = JSON.parse(localStorage.getItem('environment') || '{}').id;
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    const body = { ...req, environmentId: envId, projectId: projectId };
    return this.http.post(`${this.deploymentManagement}/deployments`, body)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteDeployment(deploymentId: string) {
    const envId = JSON.parse(localStorage.getItem('environment') || '{}').id;
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    return this.http.delete(`${this.deploymentManagement}/deployments?deploymentId=${deploymentId}&environmentId=${envId}&projectId=${projectId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updateDeployment(deploymentId: string, req: any) {
    const envId = JSON.parse(localStorage.getItem('environment') || '{}').id;
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    const body = { ...req, environmentId: envId, projectId: projectId };
    return this.http.put(`${this.deploymentManagement}/deployments/${deploymentId}`, body)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  createEndpoint(environmentId: string, req: any) {
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    return this.http.post(`${this.deploymentManagement}/endpoints`, { environmentId, projectId, ...req })
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
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    return this.http.get(`${this.deploymentManagement}/endpoints?id=${deploymentId}&environmentId=${env}&projectId=${projectId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteEndpoint(environmentId: string, name: string) {
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    return this.http.delete(`${this.deploymentManagement}/endpoints`, {
      body: {
        name,
        environmentId,
        projectId
      }
    }
    )
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

  getAvailableBranches(projectID: string, provider: string, repoId: string | number) {
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


  getS3Details(fileExtension: string) {
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    const envId = JSON.parse(localStorage.getItem('environment') || '{}').id;
    return this.http.get(`${this.deploymentManagement}/artificat?fileExtension=${fileExtension}&environmentId=${envId}&projectId=${projectId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  uploadFileToS3(url: string, file: any, contentType: string) {
    return this.http.put(url, file, {
      headers: { 'Content-Type': contentType },
      observe: 'response'
    }).pipe(
      map(response => response.status === 200 || response.status === 204),
      catchError(this.handleError.bind(this)),
      finalize(() => {
        this.loaderService.hide();
      })
    );
  }
  getDeploymentMetricsByTime(envId: string, from: string, to: string, timeInterval: number, resourceType: 'cpu' | 'memory', deploymentId: string) {
    return this.http.get(`${this.metricsApiUrl}/resources?cluster=prod&namespace=${envId}&resourceType=${resourceType}&deploymentId=${deploymentId}&from=${from}&to=${to}&step=${timeInterval}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  liveReleaseStatus(deploymentId: string) {
    const token = localStorage.getItem("accessToken")!;
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    const envId = JSON.parse(localStorage.getItem('environment') || '{}').id;
    const url = `${this.deploymentManagement}/live/release/stream?deploymentId=${deploymentId}&projectId=${projectId}&environmentId=${envId}&interval=5`;
    return createSSEObservable(url, token, this.zone);
  }

  liveDeploymentData(envId: string) {
    const token = localStorage.getItem("accessToken")!;
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    const url = `${this.deploymentManagement}/live/deployment/stream?environmentId=${envId}&projectId=${projectId}&interval=5`;
    return createSSEObservable(url, token, this.zone);
  }

  cancelRelease(deploymentId: string, releaseId: string) {
    return this.http.put(`${this.deploymentManagement}/deployments/cancelBuildJob/${deploymentId}`, { releaseId })
      .pipe(
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
    return throwError(() => new Error(errorMessage));
  }


}
