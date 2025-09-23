import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceQuotaComponent } from './resource-quota.component';
import { ProjectsService } from '../../projects/projects.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { ToastrService,ToastrModule  } from 'ngx-toastr';

describe('ResourceQuotaComponent', () => {
  let component: ResourceQuotaComponent;
  let fixture: ComponentFixture<ResourceQuotaComponent>;
  let httpMock: HttpTestingController;
  let projectService: ProjectsService;

  const mockResponse = {
   "status": "success",
    "message": "Plan limits retrieved successfully",
    "data": {
        "plan": "TRIAL",
        "details": [
            {
                "resource_type": "CPU",
                "default_limit": 0.5,
                "max_limit": 1,
                "unit": "vCPU",
                "created_at": "2025-03-04T06:23:28.517Z",
                "updated_at": "2025-03-04T06:23:28.517Z",
                "created_by": "admin",
                "updated_by": null,
                "deleted_at": null
            },
            {
                "resource_type": "RAM",
                "default_limit": 1,
                "max_limit": 64,
                "unit": "GB",
                "created_at": "2025-03-04T06:23:28.517Z",
                "updated_at": "2025-03-04T06:23:28.517Z",
                "created_by": "admin",
                "updated_by": null,
                "deleted_at": null
            },
            {
                "resource_type": "MEMORY",
                "default_limit": 20,
                "max_limit": 512,
                "unit": "GB",
                "created_at": "2025-03-04T06:23:28.517Z",
                "updated_at": "2025-03-04T06:23:28.517Z",
                "created_by": "admin",
                "updated_by": null,
                "deleted_at": null
            }
        ]
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResourceQuotaComponent,HttpClientTestingModule, ReactiveFormsModule,ToastrModule.forRoot()],
      providers: [FormBuilder, ProjectsService, ToastrService]
    });

    fixture = TestBed.createComponent(ResourceQuotaComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    projectService = TestBed.inject(ProjectsService);

    spyOn(projectService, 'getPlanLimits').and.returnValue(of(mockResponse));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form correctly', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne('https://api.dev.nimbuz.tech/project-management/v1/plans/Trial');
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
    expect(component.resourceQuotaForm).toBeTruthy();
    expect(component.resourceQuotaForm.get('cpu.current_cpu')?.value).toBe(mockResponse.data.details[0].default_limit);
    expect(component.resourceQuotaForm.get('ram.current_ram')?.value).toBe(mockResponse.data.details[1].default_limit);
    expect(component.resourceQuotaForm.get('storage.current_storage')?.value).toBe(mockResponse.data.details[2].default_limit);
  });

  it('should call getPlanLimits and populate form with response data', () => {
    fixture.detectChanges(); 
  
    const req = httpMock.expectOne('https://api.dev.nimbuz.tech/project-management/v1/plans/Trial');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse); 

    expect(component.resourceQuotaForm.get('cpu.current_cpu')?.value).toBe(mockResponse.data.details[0].default_limit);
    expect(component.resourceQuotaForm.get('cpu.min_cpu')?.value).toBe(0);
    expect(component.resourceQuotaForm.get('cpu.max_cpu')?.value).toBe(mockResponse.data.details[0].max_limit);
    expect(component.resourceQuotaForm.get('cpu.unit')?.value).toBe(mockResponse.data.details[0].unit);

    expect(component.resourceQuotaForm.get('ram.current_ram')?.value).toBe(mockResponse.data.details[1].default_limit);
    expect(component.resourceQuotaForm.get('ram.min_ram')?.value).toBe(0);
    expect(component.resourceQuotaForm.get('ram.max_ram')?.value).toBe(mockResponse.data.details[1].max_limit);
    expect(component.resourceQuotaForm.get('ram.unit')?.value).toBe(mockResponse.data.details[1].unit);

    expect(component.resourceQuotaForm.get('storage.current_storage')?.value).toBe(mockResponse.data.details[2].default_limit);
    expect(component.resourceQuotaForm.get('storage.min_storage')?.value).toBe(0);
    expect(component.resourceQuotaForm.get('storage.max_storage')?.value).toBe(mockResponse.data.details[2].max_limit);
    expect(component.resourceQuotaForm.get('storage.unit')?.value).toBe(mockResponse.data.details[2].unit);
  });

});
