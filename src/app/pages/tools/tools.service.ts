import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ToolsService {
    private apiUrl = environment.apiUrl;
    private legacyUrl = environment.legacyUrl;
    private deploymentUrl = environment.deploymentManagement;

    constructor(public http: HttpClient, private toastr: ToastrService) { }

    getToolsList(env: string) {
        return this.http.get(`${this.deploymentUrl}/tools/allInstalledTools/${env}`).pipe(
            catchError((error: HttpErrorResponse) => {
                // this.toastr.error(error.error?.error || 'Unknown error', 'Error');
                return throwError(() => new Error('Something bad happened; please try again later.'));
            })
        );
    }

    getFormDetailsByTool(id: any) {
        return this.http.get(`${this.deploymentUrl}/tools/${id}`)
            .pipe(
                catchError(this.handleError)
            );
    }

    getToolsValuesToUpdate(env: string, name: string) {
        return this.http.get(`${this.deploymentUrl}/${env}/tools/${name}/values`)
            .pipe(
                catchError(this.handleError)
            );
    }

    createTools(env: string, req: any) {
        return this.http.post(`${this.deploymentUrl}/tools/${env}`, req)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getToolDetailsById(env: string, id: any) {
        return this.http.get(`${this.deploymentUrl}/tools/${env}/getToolValues/${id}`)
            .pipe(
                catchError(this.handleError)
            );
    }

    updateTools(env: string, req: any) {
        return this.http.post(`${this.deploymentUrl}/tools/${env}`, req)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    deleteTools(env: string, name: string) {
        return this.http.delete(`${this.deploymentUrl}/${env}/tools/${name}`)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getAvailableToolsList() {
        return this.http.get(`${this.deploymentUrl}/tools/getAllTools`)
            .pipe(
                catchError(this.handleError)
            );
    }

    getToolNameValidation(env: string, name: string) {
        return this.http.get(`${this.deploymentUrl}/tools/${env}/${name}`)
          .pipe(
                catchError(this.handleError)
            );
    }

    getToolsResourceAllocation(toolName?: string, envId?: string) {
        let params = new HttpParams()
        if (toolName) {
            params = params.set('toolName', toolName);
          }
          if (envId) {
            params = params.set('environmentId', envId);
          }
        return this.http.get(`${this.deploymentUrl}/deployment/getResourceAllocationDetails`,{ params })
            .pipe(
                catchError(this.handleError)
            );
    }

    getInstanceTypes() {
    return this.http.get(`${this.deploymentUrl}/instanceTypes`)
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
        // this.toastr.error(errorMessage, 'Error');
        return throwError(() => new Error(errorMessage));
    }
}
