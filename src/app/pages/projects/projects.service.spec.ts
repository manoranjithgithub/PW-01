import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectsService } from './projects.service';
import { HttpClient } from '@angular/common/http';
import { ToastrService,ToastrModule  } from 'ngx-toastr';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule,ToastrModule.forRoot()], 
      providers: [ProjectsService,ToastrService]
    });
    service = TestBed.inject(ProjectsService);
    httpMock = TestBed.inject(HttpTestingController); 
  });

  afterEach(() => {
    httpMock.verify();  
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  //getAllProjects
  it('should fetch data successfully', () => {
    const mockData = { projectId: 1, projectName: 'Test' };

    service.getAllProjects().subscribe((data) => {
      expect(data).toEqual(mockData); 
    });

    // Mock the HTTP request
    const req = httpMock.expectOne('https://api.dev.nimbuz.tech/project-management/v1/projects');
    expect(req.request.method).toBe('GET'); 
    req.flush(mockData); 

    httpMock.verify(); 
  });

  //CreateProject
  it('should create a project with the provided data', () => {
    const projectData = {
      name: 'default',
      description: '',
      envName: 'default',
      region: 'ap-south-1',
    };

    // Mock response data
    const mockResponse = {
      success: true,
      message: 'Project created successfully',
      project:{
        id:'28e087a3-993a-421d-b322',
        name:'default',
        description:'',
        envName:'default',
        region:'ap-south-1'
      }
    };

    // Call the createProject method
    service.createProject(projectData).subscribe((response : any) => {
      expect(response.success).toBe(true); 
      expect(response.message).toBe('Project created successfully'); 
      expect(response.project).toEqual({
        id: '28e087a3-993a-421d-b322',
        name: 'default',
        description: '',
        envName: 'default',
        region: 'ap-south-1',
      });
    });

    // Mock the HTTP request
    const req = httpMock.expectOne('https://api.dev.nimbuz.tech/project-management/v1/projects/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(projectData); 

    req.flush(mockResponse); 
  });

  //GetProjectByName
  it('should fetch project details by id and return project', () => {
    const projectId = '480189b7-eb3b-4caa-85d4-c3813511166f';
    const mockResponse = {
      status: 'success',
      data: {
        id: '258fc589-bb2b-4948-af09-faae959c18f9',
        name: 'Diligen-tech-project-test12',
        description: '',
        user_id: '6be443bb-1007-4cfb-a42a-85248d352f4f',
        environments: [
          {
            id: 'env-mf4ybd',
            name: 'devdt1',
            cluster_id: '91c58a65-4f24-4b2d-a491-a2521f5c2056',
            ingress_domain: '*.env-mf4ybd.*.dev-lb.nimbuz.tech'
          }
        ]
      }
    };

    service.getProjectDetailsById(projectId).subscribe((response: any) => {
      // Assert the status
      expect(response.status).toBe('success');
      
      // Assert the project details in 'data'
      expect(response.data.id).toBe('258fc589-bb2b-4948-af09-faae959c18f9');
      expect(response.data.name).toBe('Diligen-tech-project-test12');
      expect(response.data.description).toBe('');
      expect(response.data.user_id).toBe('6be443bb-1007-4cfb-a42a-85248d352f4f');

      // Assert the environments array and its contents
      expect(response.data.environments.length).toBeGreaterThan(0); // Ensure there is at least one environment
      expect(response.data.environments[0].id).toBe('env-mf4ybd');
      expect(response.data.environments[0].name).toBe('devdt1');
      expect(response.data.environments[0].ingress_domain).toBe('*.env-mf4ybd.*.dev-lb.nimbuz.tech');
    });

    // Mock the HTTP request
    const reqMock = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/projects/${projectId}`);
    expect(reqMock.request.method).toBe('GET'); // Ensure the request method is GET
    reqMock.flush(mockResponse); // Return the mock response
  });


  //UpdateProject
  it('should update a project and return the updated project data', () => {
    const projectId = '28e087a3-993a-421d-b322';
    const req = {
      projectName: 'ProjectName',
      description: 'Updated project description',
    };

    const mockResponse = {
      status: 'success',
      message: 'Project updated successfully',
      data:{
        id: '28e087a3-993a-421d-b322',
        name: 'ProjectName',
        description: 'Updated project description',
      }
    };

    service.updateProject(projectId, req).subscribe((response : any) => {
      expect(response.data.id).toBe(projectId); 
      expect(response.data.name).toBe(req.projectName); 
      expect(response.data.description).toBe(req.description); 
    });

    const reqMock = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/projects/${projectId}`);
    expect(reqMock.request.method).toBe('PUT');
    expect(reqMock.request.body).toEqual(req); 

    reqMock.flush(mockResponse); 
  });

  //DeleteProject
  it('should delete a project and return a success message', () => {
    const projectId = '28e087a3-993a-421d-b322'; 

    const mockResponse = {
      success: true,
      message: 'Project deleted successfully',
    };

    service.deleteProject(projectId).subscribe((response : any) => {
      expect(response.success).toBe(true); 
      expect(response.message).toBe('Project deleted successfully'); 
    });

    const reqMock = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/projects/${projectId}`);
    expect(reqMock.request.method).toBe('DELETE'); 
    reqMock.flush(mockResponse); 
  });

  //CreateEnvironment
  it('should create an environment and return success response', () => {
    const projectId = '8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c';
    const mockResponse = {
      status: 'success',
      message: 'Environment created successfully.',
      data: {
        id: 'bb212db4-e766-43af-9d74-2a38ac12acdf',
        name: 'test',
        clusterID: '1',
        userID: '8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c',
        projectId: '8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c',
        ingressDomain: '*.env-abc123.example.com'
      }
    };
    const requestPayload = {
      name: 'test',
      region: 'ap-south-1'
    };

    service.createEnvironment(projectId, requestPayload).subscribe((response: any) => {
      expect(response.status).toBe('success');
      expect(response.message).toBe('Environment created successfully.');
      expect(response.data.id).toBe('bb212db4-e766-43af-9d74-2a38ac12acdf');
      expect(response.data.name).toBe('test');
      expect(response.data.clusterID).toBe('1');
      expect(response.data.userID).toBe('8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c');
      expect(response.data.projectId).toBe('8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c');
      expect(response.data.ingressDomain).toBe('*.env-abc123.example.com');
    });

    const reqMock = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/projects/${projectId}/environments`);
    expect(reqMock.request.method).toBe('POST'); 
    reqMock.flush(mockResponse); 
  });

  //UpdateEnvironment
  it('should update an environment and return success response', () => {
    const projectId = '8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c';
    const environmentId = 'env-update';
    const mockResponse = {
      "status": "Success",
      "message": "Environment updated successfully.",
      "data": {
          "id": "8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c",
          "name": "env-update",
          "cluster_id": "91c58a65-4f24-4b2d-a491-a2521f5c2056",
          "user_id": "91c58a65-4f24-4b2d-a491-a2521f5c2056",
          "project_id": "8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c"
      }
  }
    const requestPayload =    {
      "name" : "env-update"
  }

    service.updateEnvironment(projectId, environmentId, requestPayload).subscribe((response: any) => {
      expect(response.status).toBe('Success');
      expect(response.message).toBe('Environment updated successfully.');
      expect(response.data.id).toBe('8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c');
      expect(response.data.name).toBe('env-update');
      expect(response.data.cluster_id).toBe('91c58a65-4f24-4b2d-a491-a2521f5c2056');
      expect(response.data.user_id).toBe('91c58a65-4f24-4b2d-a491-a2521f5c2056');
      expect(response.data.project_id).toBe('8a0263f3-bbdc-4e54-ac68-9cebbe03fa5c');
    });

    const reqMock = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/projects/${projectId}/environments/${environmentId}`);
    expect(reqMock.request.method).toBe('PUT'); 
    reqMock.flush(mockResponse); 
  });

  //DeleteEnvironment
  it('should delete a environment and return a success message', () => {
    const mockReq = { projectId:'981ceeac-ba33-4331-a186-255f75b7a560',envId: 'envhlk'};

    const mockResponse = {
      success: true,
      message: 'Environment deleted successfully.',
    };

    service.deleteEnvironment(mockReq.projectId,mockReq.envId).subscribe((response : any) => {
      expect(response.success).toBe(true); 
      expect(response.message).toBe('Environment deleted successfully.'); 
    });

    const reqMock = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/projects/${mockReq.projectId}/environments/${mockReq.envId}`);
    expect(reqMock.request.method).toBe('DELETE'); 
    reqMock.flush(mockResponse); 
  });

  //ListEnvironment
  it('should fetch environment details and return success message', () => {
    const mockReq = { projectId: '258fc589-bb2b-4948-af09-faae959c18f9' };  
    
    const mockResponse = {
      status: 'success',
      message: 'Environment details returned successfully',
      data: [
        {
          id: 'env-mf4ybd',
          name: 'devdt1',
          cluster_id: '91c58a65-4f24-4b2d-a491-a2521f5c2056',
          user_id: '6be443bb-1007-4cfb-a42a-85248d352f4f',
          project_id: '258fc589-bb2b-4948-af09-faae959c18f9',
          ingress_domain: '*.env-mf4ybd.*.dev-lb.nimbuz.tech',
          created_by: '6be443bb-1007-4cfb-a42a-85248d352f4f',
          updated_by: null,
          created_at: '2025-03-10T08:29:38.296Z',
          updated_at: '2025-03-10T08:29:38.296Z',
          deleted_at: null
        }
      ]
    };
  
    service.getEnvironmentsByProject(mockReq.projectId).subscribe((response: any) => {
      expect(response.status).toBe('success');
      expect(response.message).toBe('Environment details returned successfully');
      
      expect(response.data.length).toBeGreaterThan(0);  
      expect(response.data[0].id).toBe('env-mf4ybd');
      expect(response.data[0].name).toBe('devdt1');
      expect(response.data[0].cluster_id).toBe('91c58a65-4f24-4b2d-a491-a2521f5c2056');
      expect(response.data[0].ingress_domain).toBe('*.env-mf4ybd.*.dev-lb.nimbuz.tech');
      expect(response.data[0].created_at).toBe('2025-03-10T08:29:38.296Z');
    });
  
    const reqMock = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/projects/${mockReq.projectId}/environments`);
    expect(reqMock.request.method).toBe('GET'); 
    reqMock.flush(mockResponse);
  });

  //GetPlanLimits
  it('should return plan details on success', () => {
    const mockResponse = {
      status: 'success',
      message: 'Plan limits retrieved successfully',
      data: {
        plan: 'TRIAL',
        details: [
          {
            resource_type: 'CPU',
            default_limit: 0.5,
            max_limit: 1,
            unit: 'vCPU',
            created_at: '2025-03-04T06:23:28.517Z',
            updated_at: '2025-03-04T06:23:28.517Z',
            created_by: 'admin',
            updated_by: null,
            deleted_at: null
          },
          {
            resource_type: 'RAM',
            default_limit: 1,
            max_limit: 64,
            unit: 'GB',
            created_at: '2025-03-04T06:23:28.517Z',
            updated_at: '2025-03-04T06:23:28.517Z',
            created_by: 'admin',
            updated_by: null,
            deleted_at: null
          },
          {
            resource_type: 'MEMORY',
            default_limit: 20,
            max_limit: 512,
            unit: 'GB',
            created_at: '2025-03-04T06:23:28.517Z',
            updated_at: '2025-03-04T06:23:28.517Z',
            created_by: 'admin',
            updated_by: null,
            deleted_at: null
          }
        ]
      }
    };

    const plan = 'TRIAL';
    
    service.getPlanLimits(plan).subscribe(response => {
      expect(response).toEqual(mockResponse); 
    });

    const req = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/plans/${plan}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
