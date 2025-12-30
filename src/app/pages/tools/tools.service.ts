import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import {createSSEObservable} from '../../shared/utils/sse.utils'; 
@Injectable({
    providedIn: 'root'
})
export class ToolsService {
    private deploymentUrl = environment.deploymentManagement;
    private pricingManagement = environment.pricingManagement;

    // expose a wrapper for createSSEObservable so tests can spyOn the instance method
    public createSSE = createSSEObservable;

    constructor(public http: HttpClient, private toastr: ToastrService, private zone: NgZone) { }

    getToolsList(env: string) {
        return this.http.get(`${this.deploymentUrl}/tools/installed/${env}`).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    getFormDetailsByTool(id: any) {
        return this.http.get(`${this.deploymentUrl}/tools/supported/${id}`)
            .pipe(
                catchError(this.handleError)
            );
    }

    getToolsValuesToUpdate(env: string, name: string) {
        return this.http.get(`${this.deploymentUrl}/${env}/tools/supported/${name}/values`)
            .pipe(
                catchError(this.handleError)
            );
    }

    createTools(req: any) {
        return this.http.post(`${this.deploymentUrl}/tools/`, req)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getToolDetailsById(env: string, id: any) {
        const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
        return this.http.get(`${this.deploymentUrl}/tools/values?environmentId=${env}&name=${id}&projectId=${projectId}`)
            .pipe(
                catchError(this.handleError)
            );
    }

    updateTools(req: any) {
        return this.http.patch(`${this.deploymentUrl}/tools`, req)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    deleteTools(env: string, name: string) {
        const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
        return this.http.delete(`${this.deploymentUrl}/tools`, { body: { environmentId: env, name, projectId } })
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getAvailableToolsList() {
        return this.http.get(`${this.deploymentUrl}/tools/supported`)
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
        return this.http.get(`${this.deploymentUrl}/deployment/getResourceAllocationDetails`, { params })
            .pipe(
                catchError(this.handleError)
            );
    }

    getInstanceTypes() {
        return this.http.get(`${this.pricingManagement}/public/pricing-catalog`)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    liveToolsData(envId: string) {
        const token = localStorage.getItem("accessToken")!;
        const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
        const url = `${this.deploymentUrl}/live/tools/stream?environmentId=${envId}&interval=15&projectId=${projectId}`;
        return this.createSSE(url, token, this.zone);
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
        // this.toastr.error(errorMessage, 'Error');
        return throwError(() => new Error(errorMessage));
    }
}
