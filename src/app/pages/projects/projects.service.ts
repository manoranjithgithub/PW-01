import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = environment.projectsApiUrl;
  private projectsApiUrl = environment.projectsBaseUrl;
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
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/${projectId}`, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getEnvironmentsByProject(projectId: string) {
    return this.http.get(`${this.projectsApiUrl}/environments?projectId=${projectId}`)
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
    return this.http.patch(`${this.apiUrl}/${projectId}`, req)
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

  createEnvironment(req: any) {
    return this.http.post(`${this.projectsApiUrl}/environments`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updateEnvironment(req: any) {
    return this.http.put(`${this.projectsApiUrl}/environments`, req)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deleteEnvironment(projectId: string, id: string) {
    return this.http.delete(`${this.projectsApiUrl}/environments?id=${id}`)
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
    return this.http.get(`${this.projectsApiUrl}/environments?id=${envId}`)
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

  getAllEnvironmentsByProject(projectId: string) {
    return this.http.get(`${this.projectsApiUrl}/environments?projectId=${projectId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: HttpErrorResponse) {
    const nestedDetails =
      error?.error?.error?.details || error?.error?.details || error?.error?.message || error.error?.error?.message || null;
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    }
    else if (error.status === 500) {
      errorMessage = nestedDetails || 'Server Error. Please try again later or contact support if it persists.';
    }
    else if (error.status === 404) {
      errorMessage = nestedDetails || 'Resource not found.';
    }
    else {
      errorMessage = nestedDetails || 'An unexpected error occurred. Please try again later.';
    }
    return throwError(errorMessage);
  }
}
