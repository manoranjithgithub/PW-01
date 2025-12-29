import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { createSSEObservable } from '../../shared/utils/sse.utils';

@Injectable({
  providedIn: 'root'
})
export class DashboardsService {
  private deploymentManagement = environment.deploymentManagement;
  private pricingManagement = environment.pricingManagement;
  private metricsApiUrl = environment.metricsUrl;

  constructor(public http: HttpClient, private toastr: ToastrService, private zone: NgZone) { }

  getDeployments(env: string) {
    return this.http.get(`${this.deploymentManagement}/deployments?environmentId=${env}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getDeploymentUtilization(envId: string) {
    return this.http.get(`${this.metricsApiUrl}/resources/live?namespace=${envId}&resourceType=cpu&deploymentId=b503656e-8c23-4d70-91b9-6cf34c4685de}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getEndpoints(envId: any) {
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    return this.http.get(`${this.deploymentManagement}/endpoints?environmentId=${envId}&projectId=${projectId}`)
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
    })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentUtilizationSSE(namespace: string, resourceType: 'cpu' | 'memory') {
    const token = localStorage.getItem("accessToken")!;
    const interval = resourceType === 'cpu' ? 15 : 20;
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    const envId = JSON.parse(localStorage.getItem('environment') || '{}').id;

    const url = `${this.metricsApiUrl}/namespace/live?namespace=${namespace}&resourceType=${resourceType}&interval=${interval}`;

    return createSSEObservable(url, token, this.zone);
  }

  getCostDetails(accountId: any, projectId: any, envId: string) {
    return this.http.get(`${this.pricingManagement}/costs/forecast?account_id=${accountId}&project_id=${projectId}&environment_id=${envId}&group_by=none`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getToolsList(env: string) {
    return this.http.get(`${this.deploymentManagement}/tools/installed/${env}`).pipe(
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
