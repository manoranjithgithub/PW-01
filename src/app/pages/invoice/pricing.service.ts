import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PricingsService {
  private pricingManagement = environment.pricingManagement;
  private deploymentManagement = environment.deploymentManagement;

  constructor(public http: HttpClient) { }

  getInvoiceList(accountId: string, limit: number, offset: number) {
    return this.http.get(`${this.pricingManagement}/invoices?account_id=${accountId}&limit=${limit}&offset=${offset}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  paynow(invoiceId: string): Observable<any> {
    return this.http.post<any>(`${this.pricingManagement}/pay`, { invoiceId })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getPdfInvoice(invoiceId: string): Observable<any> {
    return this.http.get(`${this.pricingManagement}/invoices/${invoiceId}/presign`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  getDeployments(projectId: string, envId: string) {
    return this.http.get(`${this.deploymentManagement}/deployments?projectId=${projectId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getToolsList(env: string) {
    return this.http.get(`${this.deploymentManagement}/tools/installed/${env}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  getInstanceTypes() {
    return this.http.get(`${this.pricingManagement}/public/pricing-catalog`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
  getCostByService(accountId: string,  fromDate: string, toDate: string, envId?: string, projectId?: string ) {
    let params = new HttpParams()
      .set('accountId', accountId)
      .set('from', fromDate)
      .set('to', toDate);
    if (projectId && projectId !== 'all' && envId) {
      params = params.set('environmentId', envId);
    }
    return this.http.get(`${this.pricingManagement}/costs/costexplorer?`, { params })
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
  getToolById(env: string, id: any) {
    const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
    return this.http.get(`${this.deploymentManagement}/tools/values?environmentId=${env}&name=${id}&projectId=${projectId}`)
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
      } else if (typeof error.error?.error === 'string') {
        errorMessage = error.error.error;
      }
    }
    return throwError(() => new Error(errorMessage));
  }


}
