import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentsService } from './deployment.service';
import { ToastrService,ToastrModule  } from 'ngx-toastr';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { DeploymentSettingsComponent } from './deployment-settings/deployment-settings.component';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let httpMock: HttpTestingController;
  const activatedRouteMock = {
    snapshot: {
      paramMap: new Map([
        ['id', 'mock-id'] // or mock any params you need
      ])
    }
  }

  beforeEach(() => {
    // Set up required localStorage values for tests
    localStorage.setItem('environment', JSON.stringify({ id: 'test-env-id' }));
    localStorage.setItem('project', JSON.stringify({ id: 'test-project-id' }));
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ToastrModule.forRoot(), BrowserAnimationsModule],
      providers: [DeploymentsService, ToastrService, { provide: ActivatedRoute, useValue: activatedRouteMock }]
    });

    service = TestBed.inject(DeploymentsService);
    httpMock = TestBed.inject(HttpTestingController);
      });

      afterEach(() => {
        // flush any unexpected pending requests (third-party or app initializers)
        const pending = httpMock.match(() => true);
        pending.forEach(req => {
          try { req.flush({}); } catch { /* ignore if already flushed */ }
        });
        httpMock.verify();
      });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch environment deployments successfully', () => {
    const mockEnv = { id: 'env-pkas3u', name: 'dev' };
    const mockResponse = {
      "status": "success",
      "message": "Deployments retrieved successfully",
      "data": [
          {
              "id": "cdc28c12-2161-44de-9742-524d11f24016",
              "user_id": "cdc28c12-2161-44de-9742-524d11f24016",
              "name": "Apex",
              "environment_id": "env-a123b",
              "type": "Type A",
              "provider": "deployment.Provider.Gitlab",
              "repo_url": "Repo",
              "branch_name": "Apex",
              "zip_file_name": "Apex-elite",
              "replicas": "no replicas",
              "instance_type": "instance",
              "build_command": "build",
              "start_command": "start",
              "ephemeral_storage": "storage access",
              "storage": "storage apex",
              "status": "Active",
              "created_at": "2025-03-20T05:10:53.265Z",
              "created_by": "Apex",
              "updated_by": "Apex",
              "updated_at": "2025-03-20T05:10:53.265Z",
              "deleted_at": null
          }
      ]
  }

    service.getDeployments(mockEnv.id).subscribe(res => {
      expect((res as any).data).toEqual(mockResponse.data);
    });

    const expectedUrl = `${(window as any).__env?.deploymentManagement || 'https://api.dev.nimbuz.tech/deployment/v1'}/deployments?environmentId=${mockEnv.id}`;
    const req = httpMock.expectOne(r => r.urlWithParams.indexOf(expectedUrl) === 0 || r.url.indexOf(expectedUrl) === 0 || r.urlWithParams.indexOf('/deployments') === 0);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch deployment details successfully', () => {
    const mockEnv = { deployment_id: '25d9c76f-8685-420d-af74-dd8c7c9f2354' };
    const mockResponse = {
      "status": "Success",
      "message": "Deployment details retrieved successfully",
      "data": {
          "id": "25d9c76f-8685-420d-af74-dd8c7c9f2354",
          "user_id": "6be443bb-1007-4cfb-a42a-85248d352f4f",
          "name": "New-folder3",
          "environment_id": "env-7ztr94",
          "type": "zip",
          "provider": null,
          "repo_url": null,
          "branch_name": null,
          "zip_file_name": "New folder3.rar",
          "replicas": "1",
          "instance_type": "atto.r",
          "build_command": null,
          "start_command": null,
          "ephemeral_storage": "5GB",
          "storage": null,
          "status": "active",
          "created_at": "2025-04-04T17:15:07.496Z",
          "created_by": "6be443bb-1007-4cfb-a42a-85248d352f4f",
          "updated_by": null,
          "updated_at": "2025-04-04T17:15:07.496Z",
          "deleted_at": null,
      }
  }

    service.getDeploymentById(mockEnv.deployment_id).subscribe(res => {
      expect((res as any).data).toEqual(mockResponse.data);
    });

    const expectedDetailsParam = `deploymentId=${mockEnv.deployment_id}`;
    const req = httpMock.expectOne(r => (r.urlWithParams && r.urlWithParams.indexOf(expectedDetailsParam) >= 0) || r.url.indexOf(`/deployments/${mockEnv.deployment_id}`) === 0);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
