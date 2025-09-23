import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentsService } from './deployment.service';
import { ToastrService,ToastrModule  } from 'ngx-toastr';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeploymentsComponent } from './deployments.component';
import { ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { DeploymentSettingsComponent } from './deployment-settings/deployment-settings.component';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let fixture: ComponentFixture<DeploymentsComponent>;
  let fixtureSettings : ComponentFixture<DeploymentSettingsComponent>;
  let httpMock: HttpTestingController;
  let deploymentComponent : DeploymentsComponent;
  let deploymentSettingsComponent : DeploymentSettingsComponent
  const activatedRouteMock = {
    snapshot: {
      paramMap: new Map([
        ['id', 'mock-id'] // or mock any params you need
      ])
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
          imports: [HttpClientTestingModule,ToastrModule.forRoot(),BrowserAnimationsModule], 
          providers: [DeploymentsService,ToastrService,
            { provide: ActivatedRoute, useValue: activatedRouteMock }
          ]
        });
        fixture = TestBed.createComponent(DeploymentsComponent);
        fixtureSettings = TestBed.createComponent(DeploymentSettingsComponent);
        service = TestBed.inject(DeploymentsService);
        httpMock = TestBed.inject(HttpTestingController);
        deploymentComponent = fixture.componentInstance;
        deploymentSettingsComponent = fixtureSettings.componentInstance;
      });

      afterEach(() => {
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

    deploymentComponent.getDeployment(mockEnv);
    const req = httpMock.expectOne(`https://api.dev.nimbuz.tech/deployment-management/v1/${mockEnv.id}/deployments`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse); 

    expect(deploymentComponent.tableData).toEqual(mockResponse.data);
    httpMock.verify();
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

    deploymentSettingsComponent.getDeploymentById();
    const req = httpMock.expectOne(`https://api.dev.nimbuz.tech/deployment-management/v1/deployments/${mockEnv.deployment_id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse); 

    expect(deploymentSettingsComponent.deploymentdetails).toEqual(mockResponse.data);
    httpMock.verify();
  });
});
