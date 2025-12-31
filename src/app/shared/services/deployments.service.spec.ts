import { TestBed } from '@angular/core/testing';
import { DeploymentsService } from './deployments.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let httpMock: HttpTestingController;
  let toastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    const toastrSpy = jasmine.createSpyObj('ToastrService', ['error', 'success', 'warning']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ToastrModule.forRoot()],
      providers: [
        DeploymentsService,
        { provide: ToastrService, useValue: toastrSpy }
      ]
    });
    service = TestBed.inject(DeploymentsService);
    httpMock = TestBed.inject(HttpTestingController);
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateDeployment', () => {
    it('should update deployment successfully', () => {
      const deploymentId = 'deploy-123';
      const requestData = { name: 'Updated Deployment' };
      const mockResponse = { success: true };

      service.updateDeployment(deploymentId, requestData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(requestData);
      req.flush(mockResponse);
    });

    it('should handle error when updating deployment fails', () => {
      const deploymentId = 'deploy-123';
      const requestData = { name: 'Updated Deployment' };
      const errorMessage = 'Update failed';

      service.updateDeployment(deploymentId, requestData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
      req.flush({ error: errorMessage }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('deleteTools', () => {
    it('should delete tools successfully', () => {
      const env = 'env-123';
      const name = 'tool-name';
      const mockResponse = { success: true };

      service.deleteTools(env, name).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.deploymentManagement}/tools`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual({ environmentId: env, name });
      req.flush(mockResponse);
    });

    it('should handle error when deleting tools fails', () => {
      const env = 'env-123';
      const name = 'tool-name';

      service.deleteTools(env, name).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.deploymentManagement}/tools`);
      req.flush({ error: 'Delete failed' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('disconnectProfile', () => {
    it('should disconnect profile successfully', () => {
      const projectID = 'project-123';
      const provider = 'github';
      const mockResponse = { success: true };

      service.disconnectProfile(projectID, provider).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.projectsBaseUrl}/integrations/vcs?projectId=${projectID}&provider=${provider}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle error when disconnecting profile fails', () => {
      const projectID = 'project-123';
      const provider = 'gitlab';

      service.disconnectProfile(projectID, provider).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.projectsBaseUrl}/integrations/vcs?projectId=${projectID}&provider=${provider}`);
      req.flush({ error: 'Disconnect failed' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getIntegrationStatus', () => {
    it('should get integration status successfully', () => {
      const projectID = 'project-123';
      const provider = 'github';
      const mockResponse = { connected: true, status: 'active' };

      service.getIntegrationStatus(projectID, provider).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.projectsBaseUrl}/integrations/vcs?projectId=${projectID}&provider=${provider}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when getting integration status fails', () => {
      const projectID = 'project-123';
      const provider = 'bitbucket';

      service.getIntegrationStatus(projectID, provider).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.projectsBaseUrl}/integrations/vcs?projectId=${projectID}&provider=${provider}`);
      req.flush({ error: 'Status check failed' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getDeploymentViewLogs', () => {
    it('should get deployment view logs successfully', () => {
      const releaseId = 'release-123';
      const logType = 'build';
      const mockResponse = { logs: ['log1', 'log2'] };

      service.getDeploymentViewLogs(releaseId, logType).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.jobExecutorBaseUrl}/releases/${releaseId}/logs?logType=${logType}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when getting logs fails', () => {
      const releaseId = 'release-123';
      const logType = 'deploy';

      service.getDeploymentViewLogs(releaseId, logType).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.jobExecutorBaseUrl}/releases/${releaseId}/logs?logType=${logType}`);
      req.flush({ error: 'Logs not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getReleasesViewByDeploymentId', () => {
    it('should get releases view by deployment id successfully', () => {
      const deploymentId = 'deploy-123';
      const mockResponse = { releases: [{ id: 'rel-1' }, { id: 'rel-2' }] };

      service.getReleasesViewByDeploymentId(deploymentId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.jobExecutorBaseUrl}/releases` &&
        request.params.get('deploymentId') === deploymentId
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty deployment id', () => {
      const deploymentId = '';
      const mockResponse = { releases: [] };

      service.getReleasesViewByDeploymentId(deploymentId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.jobExecutorBaseUrl}/releases` &&
        request.params.get('deploymentId') === ''
      );
      req.flush(mockResponse);
    });
  });

  describe('getPolicies', () => {
    it('should get policies successfully', () => {
      const mockResponse = { policies: [{ id: 'pol-1', name: 'Policy 1' }] };

      service.getPolicies().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies/org`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when getting policies fails', () => {
      service.getPolicies().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies/org`);
      req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getPolicyByUser', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'test-token-123');
    });

    afterEach(() => {
      localStorage.removeItem('accessToken');
    });

    it('should get policy by user successfully with auth token', () => {
      const mockResponse = { policy: { id: 'pol-1', name: 'User Policy' } };

      service.getPolicyByUser().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Cache-Control')).toBe('no-cache');
      expect(req.request.headers.get('authorization')).toBe('Bearer test-token-123');
      req.flush(mockResponse);
    });

    it('should handle error when getting policy by user fails', () => {
      service.getPolicyByUser().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies`);
      req.flush({ error: 'Policy not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should work with null access token', () => {
      localStorage.removeItem('accessToken');
      const mockResponse = { policy: null };

      service.getPolicyByUser().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies`);
      expect(req.request.headers.get('authorization')).toBe('Bearer null');
      req.flush(mockResponse);
    });
  });

  describe('handleError', () => {
    it('should handle ErrorEvent errors', () => {
      const deploymentId = 'deploy-123';
      const requestData = { name: 'Test' };
      const errorEvent = new ErrorEvent('Network error', { message: 'Connection timeout' });

      service.updateDeployment(deploymentId, requestData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
          expect(toastrService.error).toHaveBeenCalled();
        }
      );

      const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
      req.error(errorEvent);
    });

    it('should handle HTTP error with error message', () => {
      const deploymentId = 'deploy-123';
      const requestData = { name: 'Test' };

      service.updateDeployment(deploymentId, requestData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
      req.flush({ error: 'Custom error message' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle HTTP error without error message', () => {
      const deploymentId = 'deploy-123';
      const requestData = { name: 'Test' };

      service.updateDeployment(deploymentId, requestData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBe('Something bad happened; please try again later.');
        }
      );

      const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should log error to console for non-ErrorEvent errors', () => {
      const deploymentId = 'deploy-123';
      const requestData = { name: 'Test' };
      spyOn(console, 'error');

      service.updateDeployment(deploymentId, requestData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(console.error).toHaveBeenCalledWith('Please try again later');
        }
      );

      const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
      req.flush({}, { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in deployment id', () => {
      const deploymentId = 'deploy-123!@#$%';
      const requestData = { name: 'Test' };
      const mockResponse = { success: true };

      service.updateDeployment(deploymentId, requestData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
      req.flush(mockResponse);
    });

    it('should handle empty request data', () => {
      const deploymentId = 'deploy-123';
      const requestData = {};
      const mockResponse = { success: true };

      service.updateDeployment(deploymentId, requestData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments/${deploymentId}`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle null values in deleteTools', () => {
      const env = null as any;
      const name = null as any;
      const mockResponse = { success: true };

      service.deleteTools(env, name).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.deploymentManagement}/tools`);
      expect(req.request.body).toEqual({ environmentId: null, name: null });
      req.flush(mockResponse);
    });
  });
});
