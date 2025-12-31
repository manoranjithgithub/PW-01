import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LLMDeploymentsService } from './llm-deployment.service';
import { environment } from '../../../environments/environment';

describe('LLMDeploymentsService', () => {
  let service: LLMDeploymentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LLMDeploymentsService]
    });
    service = TestBed.inject(LLMDeploymentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('project');
    localStorage.removeItem('environment');
  });

  it('should call getDeployments with correct query params', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-1' }));
    service.getDeployments('env-1').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/llm-deployments`));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('environmentId=env-1');
    expect(req.request.urlWithParams).toContain('projectId=proj-1');
    req.flush({ status: 'success', data: [] });
  });

  it('should build getDeploymentById url correctly', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-2' }));
    service.getDeploymentById('dep-1', 'env-2').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/llm-deployments/dep-1`));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('environmentId=env-2');
    expect(req.request.urlWithParams).toContain('projectId=proj-2');
    req.flush({ status: 'success', data: {} });
  });

  it('createDeployement should POST with environment and project ids', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-x' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-x' }));
    const body = { name: 'app' };

    service.createDeployement(body).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${environment.deploymentManagement}/llm-deployments`);
    expect(req.request.method).toBe('POST');
    expect((req.request.body as any).environmentId).toBe('env-x');
    expect((req.request.body as any).projectId).toBe('proj-x');
    req.flush({ status: 'success' });
  });

  it('handleError should map error response to message', (done) => {
    service.getInstanceTypes().subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBe('custom error');
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/instance-type`);
    req.flush({ message: 'custom error' }, { status: 500, statusText: 'Server Error' });
  });

  it('should call getInstanceTypes', () => {
    service.getInstanceTypes().subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/instance-type`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [] });
  });

  it('should call deleteDeployment with deployment ID', () => {
    service.deleteDeployment('dep-123').subscribe();

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/dep-123`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ status: 'success' });
  });

  it('should call updateDeployment with deployment ID and request body', () => {
    const updateReq = { name: 'updated-app', replicas: 2 };
    service.updateDeployment('dep-456', updateReq).subscribe();

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/dep-456`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush({ status: 'success' });
  });

  it('should call getApplicationLogs with only deploymentId and defaults', () => {
    service.getApplicationLogs('dep-789').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-789/logs`));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('page=1');
    expect(req.request.urlWithParams).toContain('limit=300');
    req.flush({ status: 'success', data: [] });
  });

  it('should call getApplicationLogs with duration parameter', () => {
    service.getApplicationLogs('dep-789', 1, 300, '1h').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-789/logs`));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('timeRange')).toBe('1h');
    req.flush({ status: 'success', data: [] });
  });

  it('should call getApplicationLogs with fromTimestamp parameter', () => {
    service.getApplicationLogs('dep-789', 1, 300, undefined, '2024-01-01T00:00:00Z').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-789/logs`));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('fromTimestamp')).toBe('2024-01-01T00:00:00Z');
    req.flush({ status: 'success', data: [] });
  });

  it('should call getApplicationLogs with toTimestamp parameter', () => {
    service.getApplicationLogs('dep-789', 1, 300, undefined, undefined, '2024-12-31T23:59:59Z').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-789/logs`));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('toTimestamp')).toBe('2024-12-31T23:59:59Z');
    req.flush({ status: 'success', data: [] });
  });

  it('should call getApplicationLogs with keyword parameter', () => {
    service.getApplicationLogs('dep-789', 1, 300, undefined, undefined, undefined, 'error').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-789/logs`));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('keyword')).toBe('error');
    req.flush({ status: 'success', data: [] });
  });

  it('should call getApplicationLogs with all parameters', () => {
    service.getApplicationLogs('dep-789', 2, 500, '24h', '2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z', 'warning').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-789/logs`));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('page=2');
    expect(req.request.urlWithParams).toContain('limit=500');
    expect(req.request.params.get('timeRange')).toBe('24h');
    expect(req.request.params.get('fromTimestamp')).toBe('2024-01-01T00:00:00Z');
    expect(req.request.params.get('toTimestamp')).toBe('2024-12-31T23:59:59Z');
    expect(req.request.params.get('keyword')).toBe('warning');
    req.flush({ status: 'success', data: [] });
  });

  it('should handle error with error.error.error.details', (done) => {
    service.deleteDeployment('dep-fail').subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBe('Detailed error message');
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/dep-fail`);
    req.flush({ error: { details: 'Detailed error message' } }, { status: 400, statusText: 'Bad Request' });
  });

  it('should handle error with error.error.message', (done) => {
    service.updateDeployment('dep-fail', {}).subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBe('Error message from server');
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/dep-fail`);
    req.flush({ message: 'Error message from server' }, { status: 500, statusText: 'Server Error' });
  });

  it('should handle error with default message when no error details available', (done) => {
    service.getDeployments('env-fail').subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBe('Something went wrong. Please try again later.');
        done();
      }
    });

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/llm-deployments`));
    req.flush({}, { status: 500, statusText: 'Server Error' });
  });

  it('should handle error when error.error is undefined', (done) => {
    service.getInstanceTypes().subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBe('Something went wrong. Please try again later.');
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/instance-type`);
    req.flush(null, { status: 503, statusText: 'Service Unavailable' });
  });

  it('should handle getDeployments error', (done) => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-1' }));
    service.getDeployments('env-1').subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/llm-deployments`));
    req.flush({ message: 'Failed to fetch deployments' }, { status: 404, statusText: 'Not Found' });
  });

  it('should handle getDeploymentById error', (done) => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-2' }));
    service.getDeploymentById('dep-1', 'env-2').subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/llm-deployments/dep-1`));
    req.flush({ message: 'Deployment not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('should handle createDeployement error', (done) => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-x' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-x' }));
    const body = { name: 'app' };

    service.createDeployement(body).subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne((r) => r.url === `${environment.deploymentManagement}/llm-deployments`);
    req.flush({ message: 'Failed to create deployment' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should handle getApplicationLogs error', (done) => {
    service.getApplicationLogs('dep-789').subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-789/logs`));
    req.flush({ message: 'Failed to fetch logs' }, { status: 500, statusText: 'Server Error' });
  });

  it('should handle localStorage with empty project object', () => {
    localStorage.setItem('project', JSON.stringify({}));
    service.getDeployments('env-1').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/llm-deployments`));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [] });
  });

  it('should handle localStorage with empty environment object', () => {
    localStorage.setItem('environment', JSON.stringify({}));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-x' }));
    const body = { name: 'app' };

    service.createDeployement(body).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${environment.deploymentManagement}/llm-deployments`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'success' });
  });

  it('should call getApplicationLogs with custom page and pageSize', () => {
    service.getApplicationLogs('dep-999', 5, 100).subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-999/logs`));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('page=5');
    expect(req.request.urlWithParams).toContain('limit=100');
    req.flush({ status: 'success', data: [] });
  });

  it('should handle error with nested error structure for details', (done) => {
    service.getDeploymentById('dep-nested', 'env-1').subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBe('Nested error details');
        done();
      }
    });

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/llm-deployments/dep-nested`));
    req.flush({ error: { details: 'Nested error details' } }, { status: 403, statusText: 'Forbidden' });
  });

  it('should not set params when getApplicationLogs called without optional parameters', () => {
    service.getApplicationLogs('dep-minimal', 1, 300, undefined, undefined, undefined, undefined).subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-minimal/logs`));
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ status: 'success', data: [] });
  });

  it('should handle mixed optional parameters in getApplicationLogs', () => {
    service.getApplicationLogs('dep-mixed', 3, 250, '12h', undefined, '2024-12-31T23:59:59Z').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-mixed/logs`));
    expect(req.request.params.get('timeRange')).toBe('12h');
    expect(req.request.params.get('fromTimestamp')).toBeNull();
    expect(req.request.params.get('toTimestamp')).toBe('2024-12-31T23:59:59Z');
    expect(req.request.params.get('keyword')).toBeNull();
    req.flush({ status: 'success', data: [] });
  });

  it('should handle error when error.error exists but has no details or message', (done) => {
    service.createDeployement({ name: 'test' }).subscribe({
      next: () => fail('should have errored'),
      error: (err: Error) => {
        expect(err.message).toBe('Something went wrong. Please try again later.');
        done();
      }
    });

    const req = httpMock.expectOne((r) => r.url === `${environment.deploymentManagement}/llm-deployments`);
    req.flush({ error: {} }, { status: 500, statusText: 'Server Error' });
  });

  it('should call getApplicationLogs with only fromTimestamp and keyword', () => {
    service.getApplicationLogs('dep-partial', 1, 300, undefined, '2024-06-01T00:00:00Z', undefined, 'info').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.deploymentManagement}/deployment/dep-partial/logs`));
    expect(req.request.params.get('timeRange')).toBeNull();
    expect(req.request.params.get('fromTimestamp')).toBe('2024-06-01T00:00:00Z');
    expect(req.request.params.get('toTimestamp')).toBeNull();
    expect(req.request.params.get('keyword')).toBe('info');
    req.flush({ status: 'success', data: [] });
  });
});
