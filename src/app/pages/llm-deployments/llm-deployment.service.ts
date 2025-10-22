import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared/services/shared.service';

@Injectable({
    providedIn: 'root'
})
export class LLMDeploymentsService {
    private deploymentManagement = environment.deploymentManagement;
    private logServiceUrl = environment.logServiceUrl;
    private projectsBaseUrl = environment.projectsBaseUrl;
    private metricsApiUrl = environment.metricsUrl;

    constructor(public http: HttpClient, private toastr: ToastrService, private loaderService: SharedService) { }

    getDeployments(envId: string) {
        return this.http.get(`${this.deploymentManagement}/llm-deployments?environmentId=${envId}`)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getDeploymentById(deploymentId: string) {
        return this.http.get(`${this.deploymentManagement}/llm-deployments/${deploymentId}`)
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
        return this.http.post(`${this.deploymentManagement}/llm-deployments`, req)
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }
    // getDeploymentMetrics(req: any) {
    //     return this.http.post(`${this.pricingManagement}/metrics`, req)
    //         .pipe(
    //             catchError(this.handleError.bind(this))
    //         );
    // }
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

        // this.toastr.error(errorMessage, 'Error');
        // console.error('API Error:', errorMessage);

        return throwError(() => new Error(errorMessage));
    }


}
