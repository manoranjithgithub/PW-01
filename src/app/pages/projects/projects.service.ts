import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = environment.projectsApiUrl;
  private projectsApiUrl = environment.projectsApiUrl;
  private baseUrl = environment.projectsBaseUrl;
  private deploymentUrl = environment.deploymentManagement;
  private userManagementBaseUrl = environment.usermanagementBaseUrl;
  private pricingManagement = environment.pricingManagement;

  constructor(private http: HttpClient, private toastr: ToastrService) { }

  getAllProjects() {
    return this.http.get(`${this.apiUrl}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getProjectDetailsById(projectId: string) {
    return this.http.get(`${this.apiUrl}/${projectId}`)
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

  getDeploymentsByProject(projectId: string) {
    return this.http.get(`${this.apiUrl}/${projectId}/deployments`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  createProject(req: any) {
    return this.http.post(`${this.apiUrl}/`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updateProject(projectId: string, req: any) {
    return this.http.put(`${this.projectsApiUrl}/${projectId}`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteProject(projectId: string) {
    return this.http.delete(`${this.apiUrl}/${projectId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  createEnvironment(projectId: string, req: any) {
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
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getPlanLimits(plan: string) {
    return this.http.get(`${this.userManagementBaseUrl}/plans/${plan}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getResourceUsage(envId: string) {
    const params = new HttpParams()
      .set('plan', 'lite');
    return this.http.get(`${this.deploymentUrl}/environments/${envId}/resource-quotas/usage`, { params })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getEnvironmentById(projectId: string, envId: string) {
    return this.http.get(`${this.baseUrl}//environments/${envId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getUsageCost(req: any) {
    return this.http.post(`${this.pricingManagement}/usage-cost`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      this.toastr.error(error.error?.error)
    }
    else if (error.status === 500 && error.error && error.error?.error.details) {
      const errorMessage = error.error?.error.details;
      console.error('Internal Server Error 500:', errorMessage);
      this.toastr.error(errorMessage, 'Internal Server Error 500:')
    }
    else if (error.status === 404 && error.error && error.error?.error.details) {
      const errorMessage = error.error?.error.details;
      console.error('Internal Server Error 404:', errorMessage);
      this.toastr.error(errorMessage, 'Internal Server Error 404:')
    }
    else if (error.status === 400) {
      const errorMessage = error.error?.message || 'Bad Request';
      console.error('Bad Request:', errorMessage);
      this.toastr.error(errorMessage);
    }
    else {
      const errorMessage = error.error?.error || 'Please try again later';
      // this.toastr.error(errorMessage, 'Error');
      console.error(errorMessage);
    }
    return throwError('Something bad happened; please try again later.');
  }
}
