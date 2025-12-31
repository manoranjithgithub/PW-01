import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeploymentsService } from './deployment.service';
import { SharedService } from '../../shared/services/shared.service';
import { NgZone } from '@angular/core';
import * as sseUtils from '../../shared/utils/sse.utils';
import { of, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let httpMock: HttpTestingController;
  let loaderSpy: Partial<SharedService>;
  let zone: NgZone;

  beforeEach(() => {
    loaderSpy = { hide: jasmine.createSpy('hide') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DeploymentsService,
        { provide: SharedService, useValue: loaderSpy }
      ]
    });

    service = TestBed.inject(DeploymentsService);
    httpMock = TestBed.inject(HttpTestingController);
    zone = TestBed.inject(NgZone);
    
    // Set default localStorage values
    localStorage.setItem('environment', JSON.stringify({ id: 'env-default' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-default' }));
    localStorage.setItem('accountId', 'acc-default');
    localStorage.setItem('accessToken', 'token-default');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getInstanceTypes should call correct endpoint', () => {
    const mock = { data: [{ type: 't2.micro' }] };
    service.getInstanceTypes().subscribe(res => expect(res).toEqual(mock));

    const req = httpMock.expectOne(`${environment.pricingManagement}/public/pricing-catalog`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getInstanceTypes should handle error', () => {
    service.getInstanceTypes().subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toContain('Something went wrong')
    });

    const req = httpMock.expectOne(`${environment.pricingManagement}/public/pricing-catalog`);
    req.flush({ error: 'error' }, { status: 500, statusText: 'Server Error' });
  });

  it('getDeployments should call correct endpoint', () => {
    const envId = 'env-1';
    const mock = { data: [{ id: 'd1' }] };
    service.getDeployments(envId).subscribe(res => expect((res as any).data).toEqual(mock.data));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments?environmentId=${envId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getDeployments should handle error', () => {
    service.getDeployments('env-1').subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments?environmentId=env-1`);
    req.flush({ error: { message: 'Deployment not found' } }, { status: 404, statusText: 'Not Found' });
  });

  it('getDeploymentById should include environment and project from localStorage', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-x' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-x' }));
    const id = 'dep-123';
    const mock = { data: { id } };

    service.getDeploymentById(id).subscribe(res => expect((res as any).data).toEqual(mock.data));

    const req = httpMock.expectOne((r) => 
      r.url.includes('/deployments') && 
      r.urlWithParams.includes(`deploymentId=${id}`) &&
      r.urlWithParams.includes('environmentId=env-x') &&
      r.urlWithParams.includes('projectId=proj-x')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getDeploymentById should handle error', () => {
    const id = 'dep-123';
    service.getDeploymentById(id).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne((r) => r.urlWithParams.includes(`deploymentId=${id}`));
    req.flush({ error: { message: 'Not found' } }, { status: 404, statusText: 'Not Found' });
  });

  it('getReleaseDataById should call correct endpoint', () => {
    const releaseId = 'rel-123';
    const mock = { data: { id: releaseId } };
    
    service.getReleaseDataById(releaseId).subscribe(res => expect(res).toEqual(mock));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/releases/${releaseId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getReleaseDataById should handle error', () => {
    const releaseId = 'rel-123';
    service.getReleaseDataById(releaseId).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/releases/${releaseId}`);
    req.flush({ error: { message: 'Release not found' } }, { status: 404, statusText: 'Not Found' });
  });

  it('getAvailableRepos should call correct endpoint', () => {
    const provider = 'github';
    const projectId = 'proj-1';
    const mock = { data: [{ name: 'repo1' }] };
    
    service.getAvailableRepos(provider, projectId).subscribe(res => expect(res).toEqual(mock));

    const req = httpMock.expectOne((r) => 
      r.url.includes('/integrations/vcs/resources') &&
      r.urlWithParams.includes(`provider=${provider}`) &&
      r.urlWithParams.includes(`projectId=${projectId}`) &&
      r.urlWithParams.includes('type=repositories')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getAvailableRepos should handle error', () => {
    service.getAvailableRepos('github', 'proj-1').subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne((r) => r.url.includes('/integrations/vcs/resources'));
    req.flush({ error: { message: 'Access denied' } }, { status: 403, statusText: 'Forbidden' });
  });

  it('getReleasesByDeploymentId should call correct endpoint', () => {
    const deploymentId = 'dep-456';
    const mock = { data: [{ id: 'rel-1' }] };
    
    service.getReleasesByDeploymentId(deploymentId).subscribe(res => expect(res).toEqual(mock));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}/releases`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('createDeployement should POST with environment and project ids', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-y' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-y' }));
    const body = { name: 'test' };
    const resp = { status: 'success' };

    service.createDeployement(body).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.environmentId).toBe('env-y');
    expect(req.request.body.projectId).toBe('proj-y');
    expect(req.request.body.name).toBe('test');
    req.flush(resp);
  });

  it('createDeployement should handle error', () => {
    const body = { name: 'test' };
    service.createDeployement(body).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments`);
    req.flush({ error: { message: 'Creation failed' } }, { status: 400, statusText: 'Bad Request' });
  });

  it('deleteDeployment should call correct endpoint with params', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-z' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-z' }));
    const deploymentId = 'dep-789';
    const resp = { status: 'success' };

    service.deleteDeployment(deploymentId).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne((r) => 
      r.url.includes('/deployments') &&
      r.urlWithParams.includes(`deploymentId=${deploymentId}`) &&
      r.urlWithParams.includes('environmentId=env-z') &&
      r.urlWithParams.includes('projectId=proj-z')
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(resp);
  });

  it('deleteDeployment should handle error', () => {
    const deploymentId = 'dep-789';
    service.deleteDeployment(deploymentId).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne((r) => r.urlWithParams.includes(`deploymentId=${deploymentId}`));
    req.flush({ error: { message: 'Delete failed' } }, { status: 500, statusText: 'Server Error' });
  });

  it('updateDeployment should PUT with correct body and params', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-u' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-u' }));
    const deploymentId = 'dep-update';
    const body = { name: 'updated' };
    const resp = { status: 'success' };

    service.updateDeployment(deploymentId, body).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.environmentId).toBe('env-u');
    expect(req.request.body.projectId).toBe('proj-u');
    expect(req.request.body.name).toBe('updated');
    req.flush(resp);
  });

  it('updateDeployment should handle error', () => {
    const deploymentId = 'dep-update';
    const body = { name: 'updated' };
    service.updateDeployment(deploymentId, body).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
    req.flush({ error: { message: 'Update failed' } }, { status: 400, statusText: 'Bad Request' });
  });

  it('createEndpoint should POST with correct body', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-endpoint' }));
    const environmentId = 'env-endpoint';
    const body = { name: 'my-endpoint' };
    const resp = { status: 'success' };

    service.createEndpoint(environmentId, body).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/endpoints`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.environmentId).toBe(environmentId);
    expect(req.request.body.projectId).toBe('proj-endpoint');
    expect(req.request.body.name).toBe('my-endpoint');
    req.flush(resp);
  });

  it('createEndpoint should handle error', () => {
    const environmentId = 'env-endpoint';
    const body = { name: 'my-endpoint' };
    service.createEndpoint(environmentId, body).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/endpoints`);
    req.flush({ error: { message: 'Endpoint creation failed' } }, { status: 400, statusText: 'Bad Request' });
  });

  it('getDeploymentMetrics should POST with correct body', () => {
    const body = { deploymentId: 'dep-1', metric: 'cpu' };
    const resp = { data: { values: [] } };

    service.getDeploymentMetrics(body).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne(`${environment.pricingManagement}/metrics`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(resp);
  });

  it('getDeploymentMetrics should handle error', () => {
    const body = { deploymentId: 'dep-1' };
    service.getDeploymentMetrics(body).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.pricingManagement}/metrics`);
    req.flush({ error: { message: 'Metrics not available' } }, { status: 404, statusText: 'Not Found' });
  });

  it('getPodsByDeploymentId should call correct endpoint', () => {
    const deploymentId = 'dep-pods';
    const mock = { data: [{ name: 'pod-1' }] };

    service.getPodsByDeploymentId(deploymentId).subscribe(res => expect(res).toEqual(mock));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployment/${deploymentId}/getPodsByDeployment`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getPodsByDeploymentId should handle error', () => {
    const deploymentId = 'dep-pods';
    service.getPodsByDeploymentId(deploymentId).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployment/${deploymentId}/getPodsByDeployment`);
    req.flush({ error: { message: 'Pods not found' } }, { status: 404, statusText: 'Not Found' });
  });

  it('getAuthenticatedresponse should call correct endpoint', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-auth' }));
    const env = 'env-auth';
    const deploymentId = 'dep-auth';
    const mock = { data: { authenticated: true } };

    service.getAuthenticatedresponse(env, deploymentId).subscribe(res => expect(res).toEqual(mock));

    const req = httpMock.expectOne((r) => 
      r.url.includes('/endpoints') &&
      r.urlWithParams.includes(`deploymentId=${deploymentId}`) &&
      r.urlWithParams.includes(`environmentId=${env}`) &&
      r.urlWithParams.includes('projectId=proj-auth')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getAuthenticatedresponse should handle error', () => {
    const env = 'env-auth';
    const deploymentId = 'dep-auth';
    service.getAuthenticatedresponse(env, deploymentId).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne((r) => r.url.includes('/endpoints'));
    req.flush({ error: { message: 'Unauthorized' } }, { status: 401, statusText: 'Unauthorized' });
  });

  it('deleteEndpoint should DELETE with correct body', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-del-endpoint' }));
    const environmentId = 'env-del';
    const name = 'endpoint-to-delete';
    const resp = { status: 'success' };

    service.deleteEndpoint(environmentId, name).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/endpoints`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({
      name,
      environmentId,
      projectId: 'proj-del-endpoint'
    });
    req.flush(resp);
  });

  it('deleteEndpoint should handle error', () => {
    const environmentId = 'env-del';
    const name = 'endpoint-to-delete';
    service.deleteEndpoint(environmentId, name).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/endpoints`);
    req.flush({ error: { message: 'Delete endpoint failed' } }, { status: 500, statusText: 'Server Error' });
  });

  it('getSelectedDeploymentLogs should POST with request body', () => {
    const body = { deploymentId: 'dep-1', from: '2023-01-01' };
    const resp = { data: { logs: [] } };

    service.getSelectedDeploymentLogs(body).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne(`${environment.logServiceUrl}/v1/logs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(resp);
  });

  it('getSelectedDeploymentLogs should handle error', () => {
    const body = { deploymentId: 'dep-1' };
    service.getSelectedDeploymentLogs(body).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne(`${environment.logServiceUrl}/v1/logs`);
    req.flush({ error: { message: 'Logs not available' } }, { status: 404, statusText: 'Not Found' });
  });

  it('getVCSCallback should POST with correct params and body', () => {
    const auth_code = 'code123';
    const projectID = 'proj-vcs';
    const provider = 'github';
    const resp = { status: 'success' };

    service.getVCSCallback(auth_code, projectID, provider).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne((r) => 
      r.url.includes('/integrations/vcs/oauth/callback') &&
      r.urlWithParams.includes(`code=${auth_code}`)
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body.projectId).toBe(projectID);
    expect(req.request.body.provider).toBe(provider);
    req.flush(resp);
  });

  it('getVCSCallback should handle error', () => {
    const auth_code = 'code123';
    const projectID = 'proj-vcs';
    const provider = 'github';
    service.getVCSCallback(auth_code, projectID, provider).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne((r) => r.url.includes('/integrations/vcs/oauth/callback'));
    req.flush({ error: { message: 'OAuth failed' } }, { status: 400, statusText: 'Bad Request' });
  });

  it('getAvailableBranches should add repoId for gitlab', () => {
    const projectID = 'proj-1';
    const provider = 'gitlab';
    const repoId = 123;
    
    service.getAvailableBranches(projectID, provider, repoId).subscribe();
    
    const req = httpMock.expectOne((r) => 
      r.url.includes('/integrations/vcs/resources') &&
      r.urlWithParams.includes('type=branches') &&
      r.urlWithParams.includes('&repoId=123')
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getAvailableBranches should add repoName for github', () => {
    const projectID = 'proj-2';
    const provider = 'github';
    const repoName = 'my-repo';
    
    service.getAvailableBranches(projectID, provider, repoName).subscribe();
    
    const req = httpMock.expectOne((r) => r.urlWithParams.includes('&repoName=my-repo'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getAvailableBranches should handle error', () => {
    service.getAvailableBranches('proj-1', 'github', 'repo-1').subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne((r) => r.url.includes('/integrations/vcs/resources'));
    req.flush({ error: { message: 'Branches not found' } }, { status: 404, statusText: 'Not Found' });
  });

  it('getS3Details should call correct endpoint with params', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-s3' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'env-s3' }));
    const fileExtension = 'zip';
    const resp = { data: { url: 's3://bucket' } };

    service.getS3Details(fileExtension).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne((r) => 
      r.url.includes('/artificat') &&
      r.urlWithParams.includes(`fileExtension=${fileExtension}`) &&
      r.urlWithParams.includes('environmentId=env-s3') &&
      r.urlWithParams.includes('projectId=proj-s3')
    );
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('getS3Details should handle error', () => {
    const fileExtension = 'zip';
    service.getS3Details(fileExtension).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne((r) => r.url.includes('/artificat'));
    req.flush({ error: { message: 'S3 details not available' } }, { status: 404, statusText: 'Not Found' });
  });

  it('uploadFileToS3 should map 200 to true and call loader.hide', () => {
    const url = 'https://s3.mock';
    const file = new Blob(['x']);
    const contentType = 'text/plain';
    let result: any;

    service.uploadFileToS3(url, file, contentType).subscribe(res => result = res);

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Content-Type')).toBe(contentType);
    req.flush(null, { status: 200, statusText: 'OK' });
    
    expect(result).toBeTrue();
    expect((loaderSpy.hide as jasmine.Spy)).toHaveBeenCalled();
  });

  it('uploadFileToS3 should map 204 to true', () => {
    const url = 'https://s3.mock2';
    const file = new Blob(['y']);
    const contentType = 'application/json';
    let result: any;

    service.uploadFileToS3(url, file, contentType).subscribe(res => result = res);

    const req = httpMock.expectOne(url);
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(result).toBeTrue();
  });

  it('uploadFileToS3 should handle error and still call loader.hide', (done) => {
    const url = 'https://s3.error';
    const file = new Blob(['z']);
    const contentType = 'text/plain';

    service.uploadFileToS3(url, file, contentType).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => {
        expect(e.message).toBeDefined();
        // Check after a small delay because finalize runs after error callback
        setTimeout(() => {
          expect((loaderSpy.hide as jasmine.Spy)).toHaveBeenCalled();
          done();
        }, 10);
      }
    });

    const req = httpMock.expectOne(url);
    req.flush({ error: 'Upload failed' }, { status: 500, statusText: 'Server Error' });
  });

  it('getDeploymentMetricsByTime should call correct endpoint with params', () => {
    const envId = 'env-metrics';
    const from = '2023-01-01T00:00:00Z';
    const to = '2023-01-02T00:00:00Z';
    const timeInterval = 60;
    const resourceType = 'cpu';
    const deploymentId = 'dep-metrics';
    const resp = { data: { values: [] } };

    service.getDeploymentMetricsByTime(envId, from, to, timeInterval, resourceType, deploymentId).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne((r) => r.url.includes('/resources'));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('cluster=prod');
    expect(req.request.urlWithParams).toContain(`namespace=${envId}`);
    expect(req.request.urlWithParams).toContain(`resourceType=${resourceType}`);
    expect(req.request.urlWithParams).toContain(`deploymentId=${deploymentId}`);
    req.flush(resp);
  });

  it('getDeploymentMetricsByTime should work with memory resourceType', () => {
    const envId = 'env-metrics';
    const from = '2023-01-01T00:00:00Z';
    const to = '2023-01-02T00:00:00Z';
    const timeInterval = 60;
    const resourceType = 'memory';
    const deploymentId = 'dep-metrics';
    const resp = { data: { values: [] } };

    service.getDeploymentMetricsByTime(envId, from, to, timeInterval, resourceType, deploymentId).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne((r) => r.urlWithParams.includes('resourceType=memory'));
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('getDeploymentMetricsByTime should handle error', () => {
    service.getDeploymentMetricsByTime('env-1', '2023-01-01', '2023-01-02', 60, 'cpu', 'dep-1').subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBeDefined()
    });

    const req = httpMock.expectOne((r) => r.url.includes('/resources'));
    req.flush({ error: { message: 'Metrics error' } }, { status: 500, statusText: 'Server Error' });
  });

  it('liveReleaseStatus should return an observable (SSE)', () => {
    localStorage.setItem('accessToken', 'tok-1');
    localStorage.setItem('project', JSON.stringify({ id: 'proj-a' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'env-a' }));

    const depId = 'dep-777';
    const obs: any = service.liveReleaseStatus(depId);
    
    expect(obs).toBeTruthy();
    expect(typeof obs.subscribe).toBe('function');
  });

  it('liveDeploymentData should return an observable (SSE)', () => {
    localStorage.setItem('accessToken', 'tok-live');
    localStorage.setItem('project', JSON.stringify({ id: 'proj-live' }));
    
    const envId = 'env-live';
    const obs: any = service.liveDeploymentData(envId);
    
    expect(obs).toBeTruthy();
    expect(typeof obs.subscribe).toBe('function');
  });

  it('handleError should return default error message when no error details', () => {
    const err = new HttpErrorResponse({ error: null });
    (service as any).handleError(err).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBe('Something went wrong. Please try again later.')
    });
  });

  it('handleError should pick nested details when available', () => {
    const nestedErr = new HttpErrorResponse({ error: { error: { details: 'nested details' } } });
    (service as any).handleError(nestedErr).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBe('nested details')
    });
  });

  it('handleError should pick message when available', () => {
    const msgErr = new HttpErrorResponse({ error: { message: 'simple message' } });
    (service as any).handleError(msgErr).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBe('simple message')
    });
  });

  it('handleError should handle empty error object', () => {
    const emptyErr = new HttpErrorResponse({ error: {} });
    (service as any).handleError(emptyErr).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBe('Something went wrong. Please try again later.')
    });
  });
});
