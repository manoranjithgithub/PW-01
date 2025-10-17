import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardsService {
  private apiUrl = environment.apiUrl;
  private legacyUrl = environment.legacyUrl;
  private deploymentManagement = environment.deploymentManagement;
  private pricingManagement = environment.pricingManagement;
  private userApiUrl = environment.usermanagementApiUrl;
  private metricsApiUrl = environment.metricsUrl;
  private BASE_URL = 'https://api.dev.nimbuz.tech';

  constructor(public http: HttpClient, private toastr: ToastrService, private zone: NgZone) { }

  getUsageCount(env: string) {
    return this.http.get(`${this.apiUrl}/${env}/usage/monthly`)
      .pipe(
        catchError(this.handleError)
      );
  }
  getDeployments(env: string) {
    return this.http.get(`${this.deploymentManagement}/deployments?environmentId=${env}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getUsageByFilter(env: string, type: string) {
    return this.http.get(`${this.apiUrl}/${env}/usage/${type}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getDeploymentStatus(env: string) {
    return this.http.get(`${this.deploymentManagement}/environments/${env}/deployments/status`)
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
  getUsageCost(req: any) {
    return this.http.post(`${this.metricsApiUrl}/metrics`, {
      "fromTimestamp": "2025-10-01T08:32:00Z",
      "toTimestamp": "2025-10-31T08:28:00Z",
      "resourceId": "cm-acme-http-solver-cp9kc_acmesolver",
      "timeInterval": "10"
    })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getEndpoints(envId: any) {
    return this.http.get(`${this.deploymentManagement}/endpoints?environmentId=${envId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteEndpoint(environmentId: string, name: string) {
    return this.http.delete(`${this.deploymentManagement}/endpoints`, {
      body: {
        name,
        environmentId
      }
    })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeploymentUtilizationSSE(
    namespace: string,
    resourceType: 'cpu' | 'memory'
  ): Observable<any> {
    const token = localStorage.getItem('accessToken');

    const url =
      resourceType === 'cpu'
        ? `${this.metricsApiUrl}/namespace/live?namespace=${namespace}&resourceType=cpu&interval=15`
        : `${this.metricsApiUrl}/namespace/live?namespace=${namespace}&resourceType=memory&interval=20`;

    return new Observable(observer => {
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
      })
        .then(response => {
          if (!response.body) throw new Error('No response body from SSE endpoint');

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          const read = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                observer.complete();
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data:')) {
                  const dataStr = line.replace(/^data:\s*/, '');
                  try {
                    const data = JSON.parse(dataStr);
                    this.zone.run(() => observer.next(data));
                  } catch (e) {
                    console.error('Invalid SSE JSON:', e);
                  }
                }
              }

              read();
            }).catch(err => observer.error(err));
          };

          read();
        })
        .catch(err => observer.error(err));

      return () => console.log(`${resourceType} SSE unsubscribed`);
    });
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
