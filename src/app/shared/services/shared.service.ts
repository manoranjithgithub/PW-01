import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface User {
  id?: string;
  avatar: string;
  email?: string;
  name?: string;
  userName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private valueChangeSource = new Subject<string>();
  valueChange$ = this.valueChangeSource.asObservable();

  private envValueChangeSource = new Subject<string>();
  envValueChange$ = this.envValueChangeSource.asObservable();

  private projectValueChangeSource = new Subject<string>();
  projectValueChange$ = this.projectValueChangeSource.asObservable();

  private envDDChangeSource = new BehaviorSubject<any[]>([]);
  envDDChange$ = this.envDDChangeSource.asObservable();

  private projectDDChangeSource = new BehaviorSubject<any[]>([]);
  projectDDChange$ = this.projectDDChangeSource.asObservable();

  private deploymentDataSubject = new BehaviorSubject<any>(null);
  deploymentData$ = this.deploymentDataSubject.asObservable();

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  private lastReleaseStatus = new BehaviorSubject<string | null>(null);
  releaseStatus$ = this.lastReleaseStatus.asObservable();

  emitEnvDDChange(value: any[]) {
    this.envDDChangeSource.next(value);
  }

  emitProjectDDChange(value: any[]) {
    this.projectDDChangeSource.next(value);
  }

  private isLoading = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoading.asObservable();

  constructor(private cookieService: CookieService,) { }

  emitValueChange(value: string) {
    this.valueChangeSource.next(value);
  }
  emitEnvValueChange(value: string) {
    this.envValueChangeSource.next(value);
  }

  emitProjectValueChange(value: string) {
    this.projectValueChangeSource.next(value);
  }

  show() {
    this.isLoading.next(true);
  }

  hide() {
    this.isLoading.next(false);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  setCookie(name: string, value: string, expireDays: number): void {
    this.cookieService.delete(name, '/deployment');
    this.cookieService.delete(name, '/projects');
    this.cookieService.set(name, value, expireDays, '/');
  }

  getCookie(name: string): string {
    return this.cookieService.get(name);
  }

  deleteCookie(name: string): void {
    this.cookieService.delete(name);
  }

  isValidName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const regex = /^[a-zA-Z0-9-]+$/;
      const valid = regex.test(control.value);
      return valid ? null : { invalidName: 'Name must contain only letters, numbers and hyphens' };
    };
  }
  setData(data: any) {
    this.deploymentDataSubject.next(data);
  }

  setUser(user: User) {
    this.userSubject.next(user);
  }

  getUser(): User | null {
    return this.userSubject.getValue();
  }

  setlastReleaseStatus(status: string) {
    this.lastReleaseStatus.next(status);
  }

  getlastReleaseStatus(): string | null {
    return this.lastReleaseStatus.getValue();
  }
}
