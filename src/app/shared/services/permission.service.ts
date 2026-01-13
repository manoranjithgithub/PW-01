import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { SharedService } from './shared.service';
import { PERM } from '../constants/permissions.constant';
import { DeploymentsService } from './deployments.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private rawPolicies$ = new BehaviorSubject<any[]>([]);

  private lastLoadedAt = 0;
  private reloadIntervalMs = 5000;

  constructor(private http: DeploymentsService, private shared: SharedService, private router: Router) {
    try {
      const cached = localStorage.getItem('policies');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          this.rawPolicies$.next(parsed);
        }
      }
    } catch (e) {
      // ignore storage errors
    }
    try {
       if (this.router.url.includes('/login')) {
        return;
      }
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        const now = Date.now();
        if (now - this.lastLoadedAt > this.reloadIntervalMs) {
          this.loadPolicies().subscribe({
            next: () => { this.lastLoadedAt = Date.now(); },
            error: () => { /* ignore */ }
          });
        }
      });
    } catch (e) {
      //if router not be available 
    }
  }

  loadPolicies(): Observable<any[]> {
    return this.http.getPolicyByUser().pipe(
      map((res: any) => (res?.status?.toLowerCase() === 'success' ? res.data || [] : [])),
      tap((policies: any[]) => {
        this.rawPolicies$.next(policies);
        try {
          localStorage.setItem('policies', JSON.stringify(policies || []));
        } catch (e) {
          // ignore storage errors
        }
      })
    );
  }

  ensureLatestPolicies(force: boolean = false): Observable<any[]> {
    const now = Date.now();
    const hasCached = (this.getRawPolicies() || []).length > 0;
    if (!force && hasCached && (now - this.lastLoadedAt) < this.reloadIntervalMs) {
      return of(this.getRawPolicies());
    }
    return this.loadPolicies().pipe(tap(() => { this.lastLoadedAt = Date.now(); }));
  }

  refreshPoliciesNow(): Observable<any[]> {
    return this.loadPolicies().pipe(tap(() => { this.lastLoadedAt = Date.now(); }));
  }

  loadPoliciesFromArray(policies: any[] = []): void {
    this.rawPolicies$.next(policies || []);
    try {
      localStorage.setItem('policies', JSON.stringify(policies || []));
    } catch (e) {
      // ignore storage errors
    }
  }

  clearPolicies(): void {
    this.rawPolicies$.next([]);
    try {
      localStorage.removeItem('policies');
    } catch (e) {
      // ignore
    }
  }

  getRawPolicies(): any[] {
    return this.rawPolicies$.getValue() || [];
  }

  hasPermission(projectId: string | null | undefined, envId: string | null | undefined, permission: string): boolean {
    const uid =  localStorage.getItem('userId') || '';
    const policies = this.getRawPolicies();
    if (!policies || policies.length === 0) return false;
    const requested = String(permission).toLowerCase();
    return policies.some((p: any) => {
      const matchesUser = String(p?.V0) === String(uid);
      const projMatch = !projectId || p?.V2 === '*' || String(p?.V2) === String(projectId);
      const envMatch = !envId || p?.V3 === '*' || String(p?.V3) === String(envId);
      if (!(matchesUser && projMatch && envMatch)) return false;

      const policyPerm = (p?.V4 || '').toString().toLowerCase();
      if (policyPerm === PERM.ALL || policyPerm === PERM.ADMIN) return true;
      if (policyPerm === requested) return true;
      if (policyPerm === PERM.WRITE && requested === PERM.READ) return true;
      return false;
    });
  }

  hasAnyPermission(permission: string): boolean {
    const uid =  localStorage.getItem('userId') || '';
    const policies = this.getRawPolicies();
    if (!policies || policies.length === 0) return false;
    const requested = String(permission).toLowerCase();
    return policies.some((p: any) => {
      if (String(p?.V0) !== String(uid)) return false;
      const policyPerm = (p?.V4 || '').toString().toLowerCase();
      if (policyPerm === PERM.ALL || policyPerm === PERM.ADMIN) return true;
      if (policyPerm === requested) return true;
      if (policyPerm === PERM.WRITE && requested === PERM.READ) return true;
      return false;
    });
  }

  getEffectivePermissionsForUser(projectId: string | null | undefined, envId: string | null | undefined): Set<string> {
    const uid =  localStorage.getItem('userId') || '';
    const policies = this.getRawPolicies();
    const caps = new Set<string>();
    if (!policies || policies.length === 0) return caps;
    policies.forEach((p: any) => {
      if (String(p?.V0) !== String(uid)) return;
      const projMatch = !projectId || p?.V2 === '*' || String(p?.V2) === String(projectId);
      const envMatch = !envId || p?.V3 === '*' || String(p?.V3) === String(envId);
      if (!(projMatch && envMatch)) return;
      const policyPerm = (p?.V4 || '').toString().toLowerCase();
      if (policyPerm === PERM.ALL || policyPerm === PERM.ADMIN) {
        caps.add(PERM.READ);
        caps.add(PERM.WRITE);
        caps.add(PERM.DELETE);
        return;
      }
      if (policyPerm === PERM.WRITE) {
        caps.add(PERM.WRITE);
        caps.add(PERM.READ);
        return;
      }
      if (policyPerm === PERM.READ) {
        caps.add(PERM.READ);
        return;
      }
      if (policyPerm === PERM.DELETE) {
        caps.add(PERM.DELETE);
        return;
      }
    });
    return caps;
  }

  getPolicyTypesForUser(userId: string | undefined, projectId: string | null | undefined, envId: string | null | undefined): Set<string> {
    const uid = userId || this.shared.getUser()?.id || localStorage.getItem('userId') || '';
    const policies = this.getRawPolicies();
    const types = new Set<string>();
    if (!policies || policies.length === 0) return types;
    policies.forEach((p: any) => {
      if (String(p?.V0) !== String(uid)) return;
      const projMatch = !projectId || p?.V2 === '*' || String(p?.V2) === String(projectId);
      const envMatch = !envId || p?.V3 === '*' || String(p?.V3) === String(envId);
      if (!(projMatch && envMatch)) return;
      const policyPerm = (p?.V4 || '').toString().toLowerCase();
      types.add(policyPerm);
    });
    return types;
  }

  hasCapability(projectId: string | null | undefined, envId: string | null | undefined, capability: string): boolean {
    const caps = this.getEffectivePermissionsForUser(projectId, envId);
    return caps.has(String(capability).toLowerCase());
  }

  hasCapabilityForCurrentUser(projectId: string | null | undefined, envId: string | null | undefined, capability: string): boolean {
    return this.hasCapability(projectId, envId, capability);
  }

  canReadForCurrentUser(projectId: string | null | undefined, envId: string | null | undefined): boolean {
    return this.hasCapabilityForCurrentUser(projectId, envId, PERM.READ);
  }

  canWriteForCurrentUser(projectId: string | null | undefined, envId: string | null | undefined): boolean {
    return this.hasCapabilityForCurrentUser(projectId, envId, PERM.WRITE) || this.hasCapabilityForCurrentUser(projectId, envId, PERM.DELETE);
  }

  canDeleteForCurrentUser(projectId: string | null | undefined, envId: string | null | undefined): boolean {
    return this.hasCapabilityForCurrentUser(projectId, envId, PERM.DELETE);
  }

  canWriteGlobal(): boolean {
    return this.hasAnyPermission(PERM.WRITE);
  }

  canAdminGlobal(): boolean {
    return this.hasAnyPermission(PERM.ADMIN);
  }
}
