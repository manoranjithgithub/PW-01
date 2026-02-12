import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginData, RegistrationData, ResetPasswordData } from '../models/user-data.model';


@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = environment.baseUrl;

    constructor(private http: HttpClient) { }

    register(data: RegistrationData): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/user/v1/user/register`, data);
    }

    login(data: LoginData): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/user/v1/user/login`, data);
    }
    forgotPassword(data: LoginData): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/user/v1/user/forgot-password`, data);
    }
    resetPassword(req: ResetPasswordData): Observable<any> {
        const accessToken = localStorage.getItem('accessToken');
        const headers: { [header: string]: string } = {};
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return this.http
            .post<any>(`${this.apiUrl}/user/v1/user/reset-password`, req, { headers })
            .pipe(
                catchError((error) => {
                    console.error('Password reset error', error);
                    return throwError(() => error);
                })
            );
    }
    updateBillingDetails(billingData: any): Observable<any> {
        const accessToken = localStorage.getItem('accessToken');
        const headers: { [header: string]: string } = {};
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return this.http
            .post<any>(`${this.apiUrl}/user/v1/company-details`, billingData, { headers })
            .pipe(
                catchError((error) => {
                    console.error('Update billing details error', error);
                    return throwError(() => error);
                })
            );
    }
    getBillingDetails(accountId: string): Observable<any> {
        const accessToken = localStorage.getItem('accessToken');
        const headers: { [header: string]: string } = {};
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return this.http
            .get<any>(`${this.apiUrl}/user/v1/company-details/${accountId}`, { headers })
            .pipe(
                catchError((error) => {
                    console.error('Get billing details error', error);
                    return throwError(() => error);
                })
            );
    }

    deleteBillingDetails(accountId: string): Observable<any> {
        const accessToken = localStorage.getItem('accessToken');
        const headers: { [header: string]: string } = {};
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return this.http
            .delete<any>(`${this.apiUrl}/user/v1/company-details/${accountId}`, { headers })
            .pipe(
                catchError((error) => {
                    console.error('Delete billing details error', error);
                    return throwError(() => error);
                })
            );
    }
}
