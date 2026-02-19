import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LLMService {
  private llmGatewayBaseUrl = environment.llmGatewayBaseUrl;

  constructor(private http: HttpClient) {}

  getAddedModels(): Observable<any> {
    return this.http
      .get(`${this.llmGatewayBaseUrl}/llms`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getAvailableModels(): Observable<any> {
    return this.http
      .get(`${this.llmGatewayBaseUrl}/models`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  addModel(payload: any): Observable<any> {
    return this.http
      .post(`${this.llmGatewayBaseUrl}/llms`, payload)
      .pipe(catchError(this.handleError.bind(this)));
  }

  rotateKey(id: string): Observable<any> {
    return this.http
      .post(`${this.llmGatewayBaseUrl}/llms/${id}/rotate-key`, {})
      .pipe(catchError(this.handleError.bind(this)));
  }

  revokeLlm(id: string): Observable<any> {
    return this.http
      .post(`${this.llmGatewayBaseUrl}/llms/${id}/revoke`, {})
      .pipe(catchError(this.handleError.bind(this)));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Something went wrong. Please try again later.';

    if (error.error) {
      if (error.error.error?.details) {
        errorMessage = error.error.error.details;
      } else if (error.error.error?.message) {
        errorMessage = error.error.error.message;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
