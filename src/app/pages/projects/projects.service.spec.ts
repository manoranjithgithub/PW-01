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
});
