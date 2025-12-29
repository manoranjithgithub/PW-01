import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class LLMDeploymentsService {
    private deploymentManagement = environment.deploymentManagement;

    constructor(public http: HttpClient) { }

    getDeployments(envId: string) {
        const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
        return this.http.get(`${this.deploymentManagement}/llm-deployments?environmentId=${envId}&projectId=${projectId}`)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getDeploymentById(deploymentId: string, envId: string) {
        const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
        return this.http.get(`${this.deploymentManagement}/llm-deployments/${deploymentId}?environmentId=${envId}&projectId=${projectId}`)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getInstanceTypes() {
        return this.http.get(`${this.deploymentManagement}/instance-type`)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    createDeployement(req: any) {
        const envId = JSON.parse(localStorage.getItem('environment') || '{}').id;
        const projectId = JSON.parse(localStorage.getItem('project') || '{}').id;
        const body = { ...req, environmentId: envId, projectId: projectId };
        return this.http.post(`${this.deploymentManagement}/llm-deployments`, body)
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
    getApplicationLogs(
        deploymentId: string, page: number = 1, pageSize: number = 300, duration?: string, fromTimestamp?: string, toTimestamp?: string, keyword?: string,
    ) {
        let params = new HttpParams();

        if (duration) {
            params = params.set('timeRange', duration);
        }
        if (fromTimestamp) {
            params = params.set('fromTimestamp', fromTimestamp);
        }
        if (toTimestamp) {
            params = params.set('toTimestamp', toTimestamp);
        }
        if (keyword) {
            params = params.set('keyword', keyword);
        }

        return this.http.get(`${this.deploymentManagement}/deployment/${deploymentId}/logs?page=${page}&limit=${pageSize}`, { params })
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
