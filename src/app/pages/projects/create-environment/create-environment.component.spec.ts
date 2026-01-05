import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateEnvironmentComponent } from './create-environment.component';
import { ProjectsService } from '../projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CreateEnvironmentComponent', () => {
  let component: CreateEnvironmentComponent;
  let fixture: ComponentFixture<CreateEnvironmentComponent>;

  let projectSpy: jasmine.SpyObj<ProjectsService>;
  let sharedSpy: jasmine.SpyObj<SharedService>;
  let toasterSpy: jasmine.SpyObj<ToastrService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const user$ = of({ owner: 'nimbuz' });

  beforeEach(async () => {
    localStorage.clear(); // Clear localStorage before each test
    projectSpy = jasmine.createSpyObj('ProjectsService', [
      'getAllProjects',
      'getAllEnvironmentsByProject',
      'createEnvironment',
      'getEnvironmentsByProject',
      'getPlanLimits'
    ]);

    projectSpy.getAllEnvironmentsByProject.and.returnValue(of({ data: [] }));
    projectSpy.createEnvironment.and.returnValue(of({ status: false }));
    projectSpy.getEnvironmentsByProject.and.returnValue(of({ data: [] }));
    projectSpy.getPlanLimits.and.returnValue(of({ data: [] }));

    sharedSpy = jasmine.createSpyObj('SharedService', ['emitEnvDDChange', 'emitEnvValueChange', 'emitProjectDDChange', 'emitProjectValueChange', 'isValidName'], { user$ });

    sharedSpy.isValidName.and.returnValue(() => null);

    toasterSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    projectSpy.getAllProjects.and.returnValue(of({ data: [{ id: 'p1', name: 'Project1' }] }));

    await TestBed.configureTestingModule({
      imports: [CreateEnvironmentComponent, HttpClientTestingModule],
      providers: [
        { provide: ProjectsService, useValue: projectSpy },
        FormBuilder,
        { provide: SharedService, useValue: sharedSpy },
        { provide: ToastrService, useValue: toasterSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
      .overrideComponent(CreateEnvironmentComponent, {
        set: {
          providers: [{ provide: ProjectsService, useValue: projectSpy }]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CreateEnvironmentComponent);
    component = fixture.componentInstance;
    (component as any).project = projectSpy;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize environment form and resourceQuotaForm', () => {
    expect(component.environmentForm).toBeTruthy();
    expect(component.resourceQuotaForm).toBeTruthy();
  });

  it('should return uniqueName error if environment name exists', () => {
    component.availableEnviroinments = ['env1'];
    const validator = component.uniqueNameValidation();
    const control: any = { value: 'env1' };
    const result = validator(control);
    expect(result?.['uniqueName']).toBeTrue();
  });

  it('should return null if environment name is unique', () => {
    component.availableEnviroinments = ['env1'];
    const validator = component.uniqueNameValidation();
    const control: any = { value: 'env2' };
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should create environment and navigate on success', () => {
    const createRes = { status: true, message: 'Environment created' };
    const envRes = { data: [{ name: 'Env1' }] };
    const projectsRes = { data: [{ id: 'p1', name: 'Project1' }] };

    projectSpy.createEnvironment.and.returnValue(of(createRes));
    projectSpy.getEnvironmentsByProject.and.returnValue(of(envRes));
    projectSpy.getAllProjects.and.returnValue(of(projectsRes));

    component.environmentForm.setValue({
      project: 'p1',
      name: 'env1',
      region: 'ap-south-1'
    });

    component.createEnvironment();

    expect(projectSpy.createEnvironment).toHaveBeenCalled();
    expect(toasterSpy.success).toHaveBeenCalledWith('Environment created');
    expect(sharedSpy.emitEnvDDChange).toHaveBeenCalledWith(envRes.data);
    expect(sharedSpy.emitProjectDDChange).toHaveBeenCalled();
    expect(sharedSpy.emitProjectValueChange).toHaveBeenCalled();
    expect(sharedSpy.emitEnvValueChange).toHaveBeenCalledWith(projectsRes.data as any);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should set default name if empty', () => {
    const createRes = { status: true, message: 'Created' };
    const envRes = { data: [] };
    projectSpy.createEnvironment.and.returnValue(of(createRes));
    projectSpy.getEnvironmentsByProject.and.returnValue(of(envRes));
    projectSpy.getAllProjects.and.returnValue(of({ data: [{ id: 'p1', name: 'Project1' }] }));

    component.environmentForm.setValue({ project: 'p1', name: '', region: 'ap-south-1 (Mumbai) - Default' });
    component.environmentForm.get('name')?.setErrors(null);
    component.createEnvironment();

    const req = projectSpy.createEnvironment.calls.mostRecent().args[0];
    expect(req.name).toBe('default');
    expect(req.region).toBe('ap-south-1');
  });

  it('should cancel and navigate back', () => {
    component.cancel();
    expect(component.isOpen).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should go back to projects', () => {
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

    expect(component.resourceQuotaForm.get('cpuMaxPlatformLimit')?.value).toBe('10'); 
  });


  it('uniqueNameValidation should be case-insensitive and trim whitespace', () => {
    component.availableEnviroinments = ['EnvOne'];
    const validator = component.uniqueNameValidation();
    const control: any = { value: '  envone  ' };
    const result = validator(control);
    expect(result?.['uniqueName']).toBeTrue();
  });

  it('uniqueNameValidation should return null for empty control', () => {
    const validator = component.uniqueNameValidation();
    const control: any = { value: '' };
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should not call createEnvironment when form invalid', () => {
    projectSpy.createEnvironment.calls.reset();
    component.environmentForm.setValue({ project: 'p1', name: 'a', region: 'ap-south-1' });
    component.environmentForm.get('name')?.setErrors({ minlength: true });
    component.createEnvironment();
    expect(projectSpy.createEnvironment).not.toHaveBeenCalled();
  });

  it('should not call getAllEnvironmentsByProject when project value is falsy', () => {
    projectSpy.getAllEnvironmentsByProject.calls.reset();
    component.environmentForm.get('project')?.setValue('');
    expect(projectSpy.getAllEnvironmentsByProject).not.toHaveBeenCalled();
  });

  it('should fetch environments on project change and populate availableEnviroinments', () => {
    projectSpy.getAllEnvironmentsByProject.and.returnValue(of({ data: [{ name: 'Env2' }, { name: 'Another' }] }));
    component.environmentForm.get('project')?.setValue('p1');
    expect(projectSpy.getAllEnvironmentsByProject).toHaveBeenCalledWith('p1');
    expect(component.availableEnviroinments).toEqual(['env2', 'another']);
  });

  it('should handle createEnvironment failure and show error toast', () => {
    const failureRes = { status: false, message: 'Failed' };
    projectSpy.createEnvironment.and.returnValue(of(failureRes));
    spyOn(console, 'error');
    component.environmentForm.setValue({
      project: 'p1',
      name: 'envx',
      region: 'ap-south-1'
    });
    component.createEnvironment();
    expect(toasterSpy.error).toHaveBeenCalledWith('Environment creation failed');
  });

});