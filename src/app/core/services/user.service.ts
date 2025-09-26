import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginData {
    username: string;
    password: string;
}

export interface RegistrationData {
    type: string;
    orgName: string;
    username: string;
    password: string;
    email: string;
    address: string;
    terms: boolean;
}
export interface ResetPasswordData {
    password: string;
    oldPassword: string;
    orgName: string;
    username: string;
}
@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = environment.loginUrl;

    constructor(private http: HttpClient) { }

    register(data: RegistrationData): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/register`, data);
    }

    login(data: LoginData): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, data);
    }
    forgotPassword(data: LoginData): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/forgot-password`, data);
    }
    resetPassword(req: ResetPasswordData): Observable<any> {
        const accessToken = localStorage.getItem('accessToken');
        const headers: { [header: string]: string } = {};
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return this.http.post<any>(`${this.apiUrl}/reset-password`, req, { headers });
    }
}
