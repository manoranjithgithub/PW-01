import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PermissionService } from './permission.service';
import { DeploymentsService } from './deployments.service';
import { SharedService } from './shared.service';

describe('PermissionService', () => {
  let svc: PermissionService;
  let depSpy: jasmine.SpyObj<DeploymentsService>;
  let sharedSpy: jasmine.SpyObj<SharedService>;

  beforeEach(() => {
    depSpy = jasmine.createSpyObj('DeploymentsService', ['getPolicyByUser']);
    sharedSpy = jasmine.createSpyObj('SharedService', ['getUser']);

    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        { provide: DeploymentsService, useValue: depSpy },
        { provide: SharedService, useValue: sharedSpy }
      ]
    });

    svc = TestBed.inject(PermissionService);
    // ensure clean storage
    localStorage.removeItem('userId');
    localStorage.removeItem('policies');
  });

  it('loadPoliciesFromArray and getRawPolicies', () => {
    const policies = [{ V0: 'u1', V2: '*', V3: '*', V4: 'admin' }];
    svc.loadPoliciesFromArray(policies as any);
    expect(svc.getRawPolicies().length).toBe(1);
  });

  it('hasPermission true for admin/all and wildcard matches', () => {
    localStorage.setItem('userId', 'u1');
    svc.loadPoliciesFromArray([{ V0: 'u1', V2: '*', V3: '*', V4: 'admin' }] as any);
    expect(svc.hasPermission('anyProj', 'anyEnv', 'read')).toBeTrue();
    expect(svc.hasPermission(null, null, 'write')).toBeTrue();
  });

  it('hasPermission respects explicit project/env and merges write->read', () => {
    localStorage.setItem('userId', 'u2');
    svc.loadPoliciesFromArray([
      { V0: 'u2', V2: 'p1', V3: 'e1', V4: 'write' }
    ] as any);
    expect(svc.hasPermission('p1', 'e1', 'read')).toBeTrue();
    expect(svc.hasPermission('p1', 'e1', 'write')).toBeTrue();
    expect(svc.hasPermission('p1', 'e2', 'read')).toBeFalse();
  });

  it('hasAnyPermission finds permission types for a user', () => {
    localStorage.setItem('userId', 'u3');
    svc.loadPoliciesFromArray([
      { V0: 'u3', V2: '*', V3: '*', V4: 'write' }
    ] as any);
    expect(svc.hasAnyPermission('read')).toBeTrue();
    expect(svc.hasAnyPermission('delete')).toBeFalse();
  });

  it('getEffectivePermissionsForUser returns proper capability set', () => {
    localStorage.setItem('userId', 'u4');
    svc.loadPoliciesFromArray([
      { V0: 'u4', V2: 'pX', V3: 'eX', V4: 'admin' },
      { V0: 'u4', V2: 'pY', V3: 'eY', V4: 'read' }
    ] as any);
    const capsPX = svc.getEffectivePermissionsForUser('pX', 'eX');
    expect(capsPX.has('read')).toBeTrue();
    expect(capsPX.has('write')).toBeTrue();
    expect(capsPX.has('delete')).toBeTrue();

    const capsPY = svc.getEffectivePermissionsForUser('pY', 'eY');
    expect(capsPY.has('read')).toBeTrue();
    expect(capsPY.has('write')).toBeFalse();
  });

  it('ensureLatestPolicies returns cached when recent', (done) => {
    // set raw policies and lastLoadedAt to now
    svc.loadPoliciesFromArray([{ V0: 'u5', V2: '*', V3: '*', V4: 'read' }] as any);
    (svc as any).lastLoadedAt = Date.now();
    depSpy.getPolicyByUser.and.returnValue(of({ status: 'success', data: [] }));

    svc.ensureLatestPolicies(false).subscribe(v => {
      expect(v.length).toBeGreaterThanOrEqual(1);
      done();
    });
  });

  it('refreshPoliciesNow triggers loadPolicies http call', async () => {
    depSpy.getPolicyByUser.and.returnValue(of({ status: 'success', data: [{ V0: 'u6' }] }));
    await svc.refreshPoliciesNow().toPromise();
    expect(svc.getRawPolicies().length).toBeGreaterThanOrEqual(1);
  });
});
