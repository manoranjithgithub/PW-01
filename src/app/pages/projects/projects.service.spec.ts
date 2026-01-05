import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectsService } from './projects.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let httpMock: HttpTestingController;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    const toastrMock = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProjectsService,
        { provide: ToastrService, useValue: toastrMock }
      ]
    });

    service = TestBed.inject(ProjectsService);
    httpMock = TestBed.inject(HttpTestingController);
    toastrSpy = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  afterEach(() => {
    httpMock.verify(); 
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all projects', () => {
    const mockResponse = { data: [{ id: '1', name: 'Project1' }] };
    service.getAllProjects().subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.projectsApiUrl}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get project details by id', () => {
    const projectId = '1';
    const mockResponse = { id: '1', name: 'Project1' };

    service.getProjectDetailsById(projectId).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.projectsApiUrl}/${projectId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create project', () => {
    const mockReq = { name: 'NewProject' };
    const mockRes = { status: 'success', message: 'Created' };

    service.createProject(mockReq).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsApiUrl}/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReq);
    req.flush(mockRes);
  });

  it('should update project', () => {
    const projectId = '1';
    const mockReq = { name: 'UpdatedProject' };
    const mockRes = { status: 'success' };

    service.updateProject(projectId, mockReq).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsApiUrl}/${projectId}`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockRes);
  });

  it('should delete project', () => {
    const projectId = '1';
    const mockRes = { status: 'success' };

    service.deleteProject(projectId).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsApiUrl}/${projectId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockRes);
  });

  it('should get environments by project', () => {
    const projectId = '1';
    const mockRes = { data: [{ id: 'env1', name: 'Env1' }] };

    service.getEnvironmentsByProject(projectId).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsBaseUrl}/environments?projectId=${projectId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRes);
  });

  it('should create environment', () => {
    const mockReq = { name: 'Env1', projectId: '1', region: 'ap-south-1' };
    const mockRes = { status: true, message: 'Created' };

    service.createEnvironment(mockReq).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsBaseUrl}/environments`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);
  });

  it('should update environment', () => {
    const mockReq = { id: 'env1', name: 'EnvUpdated' };
    const mockRes = { status: true };

    service.updateEnvironment(mockReq).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsBaseUrl}/environments`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockRes);
  });

  it('should delete environment', () => {
    const envId = 'env1';
    const mockRes = { status: true };

    service.deleteEnvironment('1', envId).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsBaseUrl}/environments?id=${envId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockRes);
  });

  it('should get plan limits', () => {
    const plan = 'lite';
    const mockRes = { data: [{ resource_type: 'CPU', max_limit: 10 }] };

    service.getPlanLimits(plan).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/plans/${plan}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRes);
  });

  it('should include Authorization header when getting project details if token present', () => {
    const projectId = '2';
    const mockRes = { id: '2', name: 'Project2' };
    localStorage.setItem('accessToken', 'token-xyz');

    service.getProjectDetailsById(projectId).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsApiUrl}/${projectId}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-xyz');
    req.flush(mockRes);
    localStorage.removeItem('accessToken');
  });

  it('should call toastr.error for client-side ErrorEvent', () => {
    service.getAllProjects().subscribe({
      next: () => fail('should have errored'),
      error: (err) => {
        expect(err).toBeDefined();
      }
    });

    const req = httpMock.expectOne(`${environment.projectsApiUrl}`);
    const evt = new ErrorEvent('Network error', { message: 'network down' });
    req.error(evt);

    expect(toastrSpy.error).toHaveBeenCalled();
  });


  it('should return resource usage with plan query param set to lite', () => {
    const envId = 'env-123';
    const mockRes = { data: { cpu: 1 } };

    service.getResourceUsage(envId).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.deploymentManagement}/environments/${envId}/resource-quotas/usage?plan=lite`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRes);
  });

  it('should get all environments by project (duplicate endpoint) ', () => {
    const projectId = '3';
    const mockRes = { data: [{ id: 'env2' }] };

    service.getAllEnvironmentsByProject(projectId).subscribe(res => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${environment.projectsBaseUrl}/environments?projectId=${projectId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRes);
  });
  it('should handle 500 error and show toastr with message', () => {
  service.getAllProjects().subscribe({
    next: () => fail('server error'),
    error: (err) => {
      expect(err).toBeTruthy();
    }
  });

  const req = httpMock.expectOne(`${environment.projectsApiUrl}`);

  req.flush(
    {
      error: {
        details: 'Server Error. Please try again later or contact support if it persists'
      }
    },
    {
      status: 500,
      statusText: 'Internal Server Error'
    }
  );

  expect(toastrSpy.error).toHaveBeenCalledWith(
    'Server Error. Please try again later or contact support if it persists.',
    'Internal Server Error 500:'
  );
});
it('should handle 404 error and show toastr with message', () => {
  service.getAllProjects().subscribe({
    next: () => fail('should error'),
    error: (err) => {
      expect(err).toBeTruthy();
    }
  });

  const req = httpMock.expectOne(`${environment.projectsApiUrl}`);

  req.flush(
    {
      error: {
        details: 'Not found'
      }
    },
    {
      status: 404,
      statusText: 'Not Found'
    }
  );

  expect(toastrSpy.error).toHaveBeenCalledWith(
    'Not found',
    'Internal Server Error 404:'
  );
});
it('should handle unknown error status and log error message', () => {
  spyOn(console, 'error');

  service.getAllProjects().subscribe({
    next: () => fail('should error'),
    error: () => {}
  });

  const req = httpMock.expectOne(`${environment.projectsApiUrl}`);

  req.flush(
    {
      error: 'Unknown failure'
    },
    {
      status: 403,
      statusText: 'Forbidden'
    }
  );

  expect(console.error).toHaveBeenCalledWith('Unknown failure');
});
it('should get environment by id', () => {
  const projectId = 'p1';
  const envId = 'env1';
  const mockRes = { id: envId, name: 'Environment 1' };

  service.getEnvironmentById(projectId, envId).subscribe(res => {
    expect(res).toEqual(mockRes);
  });

  const req = httpMock.expectOne(
    `${environment.projectsBaseUrl}/environments?id=${envId}`
  );

  expect(req.request.method).toBe('GET');
  req.flush(mockRes);
});
it('should get usage cost', () => {
  const reqBody = {
    envId: 'env1',
    month: 'Jan'
  };

  const mockRes = {
    totalCost: 123
  };

  service.getUsageCost(reqBody).subscribe(res => {
    expect(res).toEqual(mockRes);
  });

  const req = httpMock.expectOne(
    `${environment.pricingManagement}/usage-cost`
  );

  expect(req.request.method).toBe('POST');
  expect(req.request.body).toEqual(reqBody);
  req.flush(mockRes);
});

});
