import { TestBed } from '@angular/core/testing';
import { DashboardsService } from './dashboard.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as sse from '../../shared/utils/sse.utils';
import { of } from 'rxjs';

describe('DashboardsService', () => {
  let service: DashboardsService;
  let httpMock: HttpTestingController;
  let mockToastr: jasmine.SpyObj<ToastrService>;
  let zone: NgZone;

  beforeEach(() => {
    mockToastr = jasmine.createSpyObj('ToastrService', ['error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ToastrService, useValue: mockToastr }
      ]
    });

    service = TestBed.inject(DashboardsService);
    httpMock = TestBed.inject(HttpTestingController);
    zone = TestBed.inject(NgZone);
  });

  beforeEach(() => {
    // tests expect a project id to be present in localStorage
    localStorage.setItem('project', JSON.stringify({ id: 'proj-1' }));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getDeployments should call correct endpoint', () => {
    const env = 'env1';
    const mockResp = [{ id: 1 }];
    service.getDeployments(env).subscribe(res => expect(res).toEqual(mockResp));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/list?environmentId=${env}&projectId=proj-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
  });

  it('getDeploymentUtilization should call metrics endpoint', () => {
    const envId = 'ns1';
    const mockResp = { usage: 50 };
    service.getDeploymentUtilization(envId).subscribe(res => expect(res).toEqual(mockResp));

    const expectedUrlPart = `${environment.metricsUrl}/resources/live?namespace=${envId}`;
    const req = httpMock.expectOne(r => r.urlWithParams.indexOf(expectedUrlPart) === 0 || r.url.indexOf(expectedUrlPart) === 0);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
  });

  it('getEndpoints should call endpoints API', () => {
    const env = 'env-x';
    const mockResp = [{ name: 'e' }];
    service.getEndpoints(env).subscribe(res => expect(res).toEqual(mockResp));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/endpoints/list?environmentId=${env}&projectId=proj-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
  });

  it('deleteEndpoint should send DELETE with body', () => {
    const envId = 'env-1';
    const name = 'endpoint1';
    service.deleteEndpoint(envId, name).subscribe(res => expect(res).toEqual({ ok: true }));
    const req = httpMock.expectOne(`${environment.deploymentManagement}/endpoints`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ name, environmentId: envId, projectId: 'proj-1' });
    req.flush({ ok: true });
  });

  it('getCostDetails should call pricing API with query params', () => {
    const accountId = 'a1';
    const projectId = 'p1';
    const envId = 'e1';
    const mockResp = { cost: 123 };
    service.getCostDetails(accountId, projectId, envId).subscribe(res => expect(res).toEqual(mockResp));

    const expected = `${environment.pricingManagement}/costs/forecast?account_id=${accountId}&project_id=${projectId}&environment_id=${envId}&group_by=none`;
    const req = httpMock.expectOne(expected);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
  });

  it('getToolsList should call tools installed endpoint', () => {
    const env = 'tools-env';
    const mockResp = [{ tool: 't' }];
    service.getToolsList(env).subscribe(res => expect(res).toEqual(mockResp));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/tools/installed?environmentId=${env}&projectId=proj-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
  });

  it('getDeploymentUtilizationSSE should call fetch with correct url and Authorization header', (done) => {
    const namespace = 'ns-1';
    localStorage.setItem('accessToken', 'mytoken');

    const expectedCpuUrl = `${environment.metricsUrl}/namespace/live?namespace=${namespace}&resourceType=cpu&interval=15`;
    const expectedMemUrl = `${environment.metricsUrl}/namespace/live?namespace=${namespace}&resourceType=memory&interval=20`;

    let call = 0;
    spyOn(window as any, 'fetch').and.callFake((url: string, init: any) => {
      call++;
      // first call should be cpu, second call memory
      if (call === 1) expect(url).toBe(expectedCpuUrl);
      if (call === 2) expect(url).toBe(expectedMemUrl);
      expect(init.headers.Authorization).toBe('Bearer mytoken');
      // return a minimal body reader that completes immediately
      return Promise.resolve({
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: new Uint8Array() })
          })
        }
      });
    });

    // subscribe to cpu observable and ensure it completes
    service.getDeploymentUtilizationSSE(namespace, 'cpu').subscribe({
      next: () => {},
      error: (e) => fail(e),
      complete: () => {
        // now test memory
        service.getDeploymentUtilizationSSE(namespace, 'memory').subscribe({
          next: () => {},
          error: (e) => fail(e),
          complete: () => done()
        });
      }
    });
  });

  it('should propagate server errors via handleError', () => {
    const env = 'err-env';
    service.getDeployments(env).subscribe({
      next: () => fail('should have failed'),
      error: (err) => expect(err).toBe('Something bad happened; please try again later.')
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/list?environmentId=${env}&projectId=proj-1`);
    req.flush({ error: 'server-error' }, { status: 500, statusText: 'Server Error' });
  });
});
