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

  constructor(public http: HttpClient) { }

  getInvoiceList(accountId: string, period:string, limit:number, offset:number) {
    return this.http.get(`${this.pricingManagement}/invoices?account_id=${accountId}&period=${period}&limit=${limit}&offset=${offset}`)
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
