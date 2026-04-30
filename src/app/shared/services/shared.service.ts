import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { getStatusMeta as helperGetStatusMeta } from '../helpers/status.helper';
import { InvoiceRow } from '../../core/models/company-billing-info.model';

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

  private lastReleaseData = new BehaviorSubject<string | null>(null);
  releaseStatus$ = this.lastReleaseData.asObservable();
  private optimisticDeploymentDisabled = new Map<string, boolean>();

  private currencyChangeSource = new BehaviorSubject<string>(this.getCurrencyFromStorage());
  currencyChange$ = this.currencyChangeSource.asObservable();

  private rates: { [k: string]: number } = {};
  private ratesLoadedAt = 0;
  private ratesTtlMs = 12 * 60 * 60 * 1000; // 12 hours
  private frankfurterUrl = 'https://api.frankfurter.dev/v1/latest';

  emitEnvDDChange(value: any[]) {
    this.envDDChangeSource.next(value);
  }

  emitProjectDDChange(value: any[]) {
    this.projectDDChangeSource.next(value);
  }

  private isLoading = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoading.asObservable();

  constructor(private cookieService: CookieService, private http: HttpClient) {
    // this.ensureRatesFor(['INR']).catch(() => { /* ignore */ });
  }

  emitValueChange(value: string) {
    this.valueChangeSource.next(value);
  }
  emitEnvValueChange(value: string) {
    this.envValueChangeSource.next(value);
  }

  emitProjectValueChange(value: string) {
    this.projectValueChangeSource.next(value);
  }

  setCurrency(code: string) {
    try {
      localStorage.setItem('currency', code);
    } catch (e) { 
      // ignore storage errors
    }
    this.currencyChangeSource.next(code);
    const upper = (code || 'USD').toUpperCase();
    if (upper !== 'USD') {
      this.ensureRatesFor([upper]).then(() => {
        this.currencyChangeSource.next(code);
      }).catch(() => { /* ignore */ });
    }
  }

  getCurrency(): string {
    return this.currencyChangeSource.getValue() || this.getCurrencyFromStorage() || 'USD';
  }

  private getCurrencyFromStorage(): string {
    try {
      const c = localStorage.getItem('currency');
      return c || 'USD';
    } catch (e) {
      return 'USD';
    }
  }

  convertAmount(value: number, from: string | undefined, to: string | undefined): number {
    if (value == null || isNaN(value)) return 0;
    const src = (from || 'USD').toUpperCase();
    const dst = (to || this.getCurrency()).toUpperCase();
    if (src === dst) return value;

    const now = Date.now();
    const cacheValid = (now - this.ratesLoadedAt) < this.ratesTtlMs;
    if (cacheValid && this.rates && (this.rates[src] || src === 'USD') && (this.rates[dst] || dst === 'USD')) {
      const srcRate = src === 'USD' ? 1 : this.rates[src];
      const dstRate = dst === 'USD' ? 1 : this.rates[dst];
      const inUsd = value / srcRate;
      return inUsd * dstRate;
    }

    this.ensureRatesFor([src === 'USD' ? undefined : src, dst === 'USD' ? undefined : dst].filter(Boolean) as string[])
      .catch(() => { /* ignore */ });

    const fallbackRates: { [k: string]: number } = { USD: 1, INR: 89.62 };
    const srcRate = fallbackRates[src] || 1;
    const dstRate = fallbackRates[dst] || 1;
    const inUsd = value / srcRate;
    return inUsd * dstRate;
  }

  formatMoney(amount: number | undefined | null, currencyFrom?: string): string {
    const target = this.getCurrency() || 'USD';
    const converted = this.convertAmount(Number(amount || 0), currencyFrom || 'USD', target);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: target,
        minimumFractionDigits: 2,
      }).format(converted);
    } catch (e) {
      return String(converted);
    }
  }

  isUnappliedFund(invoice: InvoiceRow): boolean {
    const status = (invoice.status || '').toLowerCase();
    return status === 'credit' || status === 'unapplied';
  }

  async ensureRatesFor(symbols: string[]): Promise<void> {
    if (!symbols || symbols.length === 0) return;
    const symbolsToFetch = symbols.map(s => s.toUpperCase()).filter(s => s !== 'USD');
    const now = Date.now();
    if ((now - this.ratesLoadedAt) < this.ratesTtlMs) {
      const missing = symbolsToFetch.filter(s => !this.rates[s]);
      if (missing.length === 0) return;
    }

    try {
      const url = `${this.frankfurterUrl}?base=USD&symbols=${symbolsToFetch.join(',')}`;
      const resp = await firstValueFrom(this.http.get<any>(url));
      if (resp && resp.rates) {
        Object.keys(resp.rates).forEach(k => this.rates[k.toUpperCase()] = Number(resp.rates[k]));
        this.ratesLoadedAt = Date.now();
      }
    } catch (e) {
      // ignore failures; callers will use fallback rates
    }
  }

  async refreshRatesNow(symbols: string[] = ['INR']): Promise<void> {
    await this.ensureRatesFor(symbols);
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

  setlastReleaseData(status: string) {
    this.lastReleaseData.next(status);
  }

  getlastReleaseData(): string | null {
    return this.lastReleaseData.getValue();
  }

  setOptimisticDeploymentDisabled(deploymentId: string, disabled: boolean): void {
    if (!deploymentId) return;
    this.optimisticDeploymentDisabled.set(deploymentId, disabled);
  }

  getOptimisticDeploymentDisabled(deploymentId: string): boolean {
    if (!deploymentId) return false;
    return this.optimisticDeploymentDisabled.get(deploymentId) || false;
  }

  clearOptimisticDeploymentDisabled(deploymentId: string): void {
    if (!deploymentId) return;
    this.optimisticDeploymentDisabled.delete(deploymentId);
  }

  getStatusMeta(status: string): { icon: string; statusClass: string; label: string } {
    return helperGetStatusMeta(status);
  }
}
