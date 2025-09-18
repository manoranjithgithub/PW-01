import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
    providedIn: 'root'
})
export class UserService {
   private apiUrl = 'https://api.dev.nimbuz.tech/user/v1/user';

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
}
