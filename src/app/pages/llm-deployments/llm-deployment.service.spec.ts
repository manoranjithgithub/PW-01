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
});
