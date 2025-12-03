import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared/services/shared.service';

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
    return this.http.get(`${this.deploymentManagement}/deployments/${deploymentId}`)
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
    return this.http.post(`${this.deploymentManagement}/deployments`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteDeployment(deploymentId: string) {
    return this.http.delete(`${this.deploymentManagement}/deployments/${deploymentId}`)
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

  createEndpoint(environmentId: string, req: any) {
    return this.http.post(`${this.deploymentManagement}/endpoints`, { environmentId, ...req })
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
    return this.http.get(`${this.deploymentManagement}/endpoints/${deploymentId}`)
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
    return this.http.get(`${this.deploymentManagement}/artificat?fileExtension=${fileExtension}`)
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
  getDeploymentMetricsByTime(envId: string, from: string, to: string, timeInterval: number) {
    return this.http.get(`${this.metricsApiUrl}/namespace?cluster=prod&namespace=${envId}&from=${from}&to=${to}&step=${timeInterval}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  liveReleaseStatus(deploymentId: string) {
    const token = localStorage.getItem('accessToken');
    const url = `${this.deploymentManagement}/live/release/stream?deploymentId=${deploymentId}`;
    return new Observable(observer => {
      const controller = new AbortController();
      const signal = controller.signal;

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

      return () => {
        // console.log(`SSE unsubscribed`);
        controller.abort(); 
      };
    });
  }

   liveDeploymentData(envId: string) {
    const token = localStorage.getItem('accessToken');
    const url = `${this.deploymentManagement}/live/deployment/stream?environmentId=${envId}&interval=15`;
    return new Observable(observer => {
      const controller = new AbortController();
      const signal = controller.signal;

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

      return () => {
        // console.log(`SSE unsubscribed`);
        controller.abort(); 
      };
    });
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
