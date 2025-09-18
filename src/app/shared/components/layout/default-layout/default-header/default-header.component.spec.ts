import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import {
  AvatarModule,
  BadgeModule,
  BreadcrumbModule,
  ButtonGroupModule,
  DropdownModule,
  GridModule,
  HeaderModule,
  NavModule,
  ProgressModule,
  SidebarModule
} from '@coreui/angular';
import { IconModule, IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '../../../../../core/icons/icon-subset';
import { DefaultHeaderComponent } from './default-header.component';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService,ToastrModule  } from 'ngx-toastr';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectsService } from '../../../../../pages/projects/projects.service';

describe('DefaultHeaderComponent', () => {
  let component: DefaultHeaderComponent;
  let fixture: ComponentFixture<DefaultHeaderComponent>;
  let iconSetService: IconSetService;
  let httpMock: HttpTestingController;
   let service: ProjectsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [GridModule, HeaderModule, IconModule, NavModule, BadgeModule, AvatarModule, DropdownModule, BreadcrumbModule, RouterTestingModule, SidebarModule, ProgressModule, ButtonGroupModule, ReactiveFormsModule, DefaultHeaderComponent, HttpClientModule, ToastrModule.forRoot(), HttpClientTestingModule],
    providers: [IconSetService, ToastrService]
})
      .compileComponents();
  });

  beforeEach(() => {
    iconSetService = TestBed.inject(IconSetService);
    iconSetService.icons = { ...iconSubset };
    service = TestBed.inject(ProjectsService);
    httpMock = TestBed.inject(HttpTestingController); 

    fixture = TestBed.createComponent(DefaultHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all projects successfully', () => {
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

  it('should load regions and environments successfully', () => {
    const mockProjectId = '8910b3b1-d25e-4191-80f1-5d8fa5a66db6';
    const mockResponse = {
      "status": "success",
      "message": "Project details fetched successfully",
      "data": {
          "id": "8910b3b1-d25e-4191-80f1-5d8fa5a66db6",
          "name": "ProjectABC",
          "description": "Test project",
          "regions": [
              {
                  "name": "ap-south-1",
                  "environments": [
                      {
                          "id": "env-yj3g9h",
                          "name": "dev",
                          "cluster_id": "91c58a65-4f24-4b2d-a491-a2521f5c2056",
                          "user_id": "b580f89a-e2a9-11ef-ae74-2c3b70582256",
                          "project_id": "8910b3b1-d25e-4191-80f1-5d8fa5a66db6",
                          "ingress_domain": "*.env-yj3g9h.*.dev-lb.nimbuz.tech",
                          "created_by": "b580f89a-e2a9-11ef-ae74-2c3b70582256",
                          "updated_by": null,
                          "created_at": "2025-03-14T18:15:51.849Z",
                          "updated_at": "2025-03-14T18:15:51.849Z",
                          "deleted_at": null
                      },
                      {
                          "id": "env-yj3g92",
                          "name": "dev2",
                          "cluster_id": "91c58a65-4f24-4b2d-a491-a2521f5c2056",
                          "user_id": "b580f89a-e2a9-11ef-ae74-2c3b70582256",
                          "project_id": "8910b3b1-d25e-4191-80f1-5d8fa5a66db6",
                          "ingress_domain": "*.env-yj3g9h.*.dev-lb.nimbuz.tech",
                          "created_by": "b580f89a-e2a9-11ef-ae74-2c3b70582256",
                          "updated_by": null,
                          "created_at": "2025-03-14T18:15:51.849Z",
                          "updated_at": "2025-03-14T18:15:51.849Z",
                          "deleted_at": null
                      }
                  ]
              }
            ]
          }
        }

    // Set the projectId and call the method
    component.projectId = mockProjectId;
    //component.getRegionsAndEnvironment();  // This method will trigger the HTTP request

    // Mock the HTTP request
    const req = httpMock.expectOne(`https://api.dev.nimbuz.tech/project-management/v1/projects/${mockProjectId}?includeRegions=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);  // Simulate the HTTP response

    // Check if the component's state is updated correctly
    expect(component.selectedRegion).toBe('ap-south-1');
    expect(component.selectedEnvironment).toBe('dev');
  });

  

  describe('isSelectedEnv', () => {
    it('should return true if the environment is selected', () => {
      component.selectedEnvironment = 'dev';
      const env = { name: 'dev' };
      expect(component.isSelectedEnv(env)).toBeTrue();
    });

    it('should return false if the environment is not selected', () => {
      component.selectedEnvironment = 'prod';
      const env = { name: 'dev' };
      expect(component.isSelectedEnv(env)).toBeFalse();
    });
  });

  describe('isSelectedRegion', () => {
    it('should return true if the region is selected', () => {
      component.selectedRegion = 'US';
      const region = { name: 'US' };
      expect(component.isSelectedRegion(region)).toBeTrue();
    });

    it('should return false if the region is not selected', () => {
      component.selectedRegion = 'EU';
      const region = { name: 'US' };
      expect(component.isSelectedRegion(region)).toBeFalse();
    });
  });

  describe('isSelectedProject', () => {
    it('should return true if the project is selected', () => {
      component.selectedProject = 'Project A';
      const project = { name: 'Project A' };
      expect(component.isSelectedProject(project)).toBeTrue();
    });

    it('should return false if the project is not selected', () => {
      component.selectedProject = 'Project B';
      const project = { name: 'Project A' };
      expect(component.isSelectedProject(project)).toBeFalse();
    });
  });
});
