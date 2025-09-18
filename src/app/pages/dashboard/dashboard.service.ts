import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
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

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getUsageCount(env: string) {
    return this.http.get(`${this.apiUrl}/${env}/usage/monthly`)
      .pipe(
        catchError(this.handleError)
      );
  }
  getDeployments(env: string) {
    return this.http.get(`${this.apiUrl}/${env}/deployments`)
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
    return this.http.get(`${this.deploymentManagement}/environments/${envId}/usage`)
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
  getEndpoints(envId: any) {
    return this.http.get(`${this.deploymentManagement}/${envId}/endpoint`)
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
