import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateProjectComponent } from './create-project.component';
import { ProjectsService } from '../projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CreateEnvironmentComponent } from '../create-environment/create-environment.component';

describe('CreateProjectComponent', () => {
  let component: CreateProjectComponent;
  let fixture: ComponentFixture<CreateProjectComponent>;

  let projectSpy: jasmine.SpyObj<ProjectsService>;
  let sharedSpy: jasmine.SpyObj<SharedService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const user$ = of({ owner: 'nimbuz' });

beforeEach(async () => {
  projectSpy = jasmine.createSpyObj('ProjectsService', [
    'getAllProjects',
    'createProject',
    'getPlanLimits'
  ]);

  sharedSpy = jasmine.createSpyObj(
    'SharedService',
    ['emitProjectDDChange', 'emitProjectValueChange', 'isValidName'],
    {
      user$: user$
    }
  );

  sharedSpy.isValidName.and.returnValue(() => null);

  toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);
  routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  projectSpy.getAllProjects.and.returnValue(of({ data: [{ name: 'project1' }] }));

  await TestBed.configureTestingModule({
  imports: [
    CreateProjectComponent,
    HttpClientTestingModule,
    BrowserAnimationsModule
  ],
  providers: [
    FormBuilder,
    { provide: SharedService, useValue: sharedSpy },
    { provide: ToastrService, useValue: toastrSpy },
    { provide: Router, useValue: routerSpy },
  ]
})
.overrideComponent(CreateProjectComponent, {
  set: {
    providers: [
      { provide: ProjectsService, useValue: projectSpy }
    ]
  }
})
.compileComponents();

  fixture = TestBed.createComponent(CreateProjectComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});


  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize project form and resource quota form', () => {
    expect(component.projectForm).toBeTruthy();
    expect(component.resourceQuotaForm).toBeTruthy();
  });

  it('should mark project name as invalid if already exists', () => {
    component.availableProjects = ['project1'];
    component.projectForm.get('projectName')?.setValue('project1');
    component.projectForm.get('projectName')?.updateValueAndValidity();
    expect(component.projectForm.get('projectName')?.errors?.['uniqueName']).toBeTrue();
  });

  it('should clear uniqueName error if project name is unique', () => {
    component.availableProjects = ['project1'];
    component.projectForm.get('projectName')?.setValue('project2');
    component.projectForm.get('projectName')?.setErrors({ uniqueName: true });
    component.projectForm.get('projectName')?.updateValueAndValidity();
    const errors = component.projectForm.get('projectName')?.errors;
    expect(errors?.['uniqueName']).toBeFalsy();
  });

  it('should call createProject and navigate on success', () => {
    const mockResponse = {
      status: 'Success',
      message: 'Created',
      data: { environment: { name: 'Env1', id: 'e1' } }
    };

    projectSpy.createProject.and.returnValue(of(mockResponse));
    projectSpy.getAllProjects.and.returnValue(of({ data: [{ name: 'project1' }] }));

    component.projectForm.setValue({
      projectName: 'project1',
      projectDesc: 'desc',
      environmentName: 'Env1',
      region: 'ap-south-1'
    });

    component.createProject();

    expect(projectSpy.createProject).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalledWith('Created');
    expect(sharedSpy.emitProjectDDChange).toHaveBeenCalled();
    expect(sharedSpy.emitProjectValueChange).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/projects']);
    expect(localStorage.getItem('project')).toBeTruthy();
    expect(localStorage.getItem('environment')).toBeTruthy();
  });

  it('should show error toast when createProject observable errors', () => {
    projectSpy.createProject.and.returnValue(throwError(() => ({ message: 'Network error' })));
    component.projectForm.setValue({
      projectName: 'project1',
      projectDesc: 'desc',
      environmentName: 'Env1',
      region: 'ap-south-1'
    });

    component.createProject();

    expect(toastrSpy.error).toHaveBeenCalled();
  });

  it('should default project and environment names if empty', () => {
    projectSpy.createProject.and.returnValue(of({ status: 'Success', message: 'Created', data: { environment: { id: 'e1' } } }));
    projectSpy.getAllProjects.and.returnValue(of({ data: [{ name: 'project1' }] }));

    component.projectForm.setValue({
      projectName: '',
      projectDesc: '',
      environmentName: '',
      region: 'ap-south-1 (Mumbai) - Default'
    });

    component.createProject();

    const req = projectSpy.createProject.calls.mostRecent().args[0];
    expect(req.name).toBe('default');
  });


  it('should navigate back to /projects', () => {
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should populate resourceQuotaForm from getPlanLimits', () => {
  const planLimits = [
    { resource_type: 'CPU', default_limit: 2, max_limit: 8, unit: 'cores' },
    { resource_type: 'RAM', default_limit: 4, max_limit: 16, unit: 'GB' },
    { resource_type: 'ephemeral_storage', default_limit: 10, max_limit: 50, unit: 'GB' }
  ];

  projectSpy.getPlanLimits.and.returnValue(of({ data: planLimits }));

  component.getPlanLimits();

  expect(component.resourceQuotaForm.get('cpu.current_cpu')?.value).toBe(2);
  expect(component.resourceQuotaForm.get('ram.max_ram')?.value).toBe(16);
  expect(component.resourceQuotaForm.get('storage.unit')?.value).toBe('GB');
});

  it('uniqueNameValidator should return error if name exists', () => {
    const validator = component.uniqueNameValidator(['proj1']);
    const control = { value: 'proj1' } as any;
    const result = validator(control);
    expect(result?.['uniqueName']).toBeTrue();
  });

  it('uniqueNameValidator should return null if name does not exist', () => {
    const validator = component.uniqueNameValidator(['proj1']);
    const control = { value: 'proj2' } as any;
    const result = validator(control);
    expect(result).toBeNull();
  });
});
