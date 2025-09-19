import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateEnvironmentComponent } from './create-environment.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProjectsService } from '../projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { RegionOptions } from '../../../core/constants/create-environment.constant';
import { RouterTestingModule } from '@angular/router/testing';


describe('CreateEnvironmentComponent', () => {
  let component: CreateEnvironmentComponent;
  let fixture: ComponentFixture<CreateEnvironmentComponent>;
  let projectServiceSpy: jasmine.SpyObj<ProjectsService>;
  let sharedServiceSpy: jasmine.SpyObj<SharedService>;
  let toasterSpy: jasmine.SpyObj<ToastrService>;
  let router: Router;

  beforeEach(async () => {

    const projectSpy = jasmine.createSpyObj('ProjectsService', ['createEnvironment', 'getEnvironmentsByProject']);
    const sharedSpy = jasmine.createSpyObj('SharedService', ['getCookie', 'setCookie', 'emitEnvDDChange', 'emitEnvValueChange', 'isValidName']);
    const toaster = jasmine.createSpyObj('ToastrService', ['success', 'error']);


    await TestBed.configureTestingModule({
      imports: [CreateEnvironmentComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        FormBuilder,
        { provide: ProjectsService, useValue: projectSpy },
        { provide: SharedService, useValue: sharedSpy },
        { provide: ToastrService, useValue: toaster }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateEnvironmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    projectServiceSpy = TestBed.inject(ProjectsService) as jasmine.SpyObj<ProjectsService>;
    sharedServiceSpy = TestBed.inject(SharedService) as jasmine.SpyObj<SharedService>;
    toasterSpy = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    router = TestBed.inject(Router);

    sharedServiceSpy.getCookie.and.returnValue(JSON.stringify({ name: 'Mock Project', id: '1' }));
    sharedServiceSpy.isValidName.and.returnValue(() => null); // valid by default

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  
  it('should initialize form with default values', () => {
    expect(component.environmentForm.value.project).toEqual('Mock Project');
    expect(component.environmentForm.value.name).toEqual('Default');
    expect(component.environmentForm.value.region).toEqual(RegionOptions[0].name);
  });

  it('should navigate to /project on goBack()', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.goBack();
    expect(navigateSpy).toHaveBeenCalledWith(['/project']);
  });

  it('should navigate to /project on cancel()', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.cancel();
    expect(navigateSpy).toHaveBeenCalledWith(['/project']);
  });

  it('should handle environment creation success with special region value conversion', () => {
    component.environmentForm.patchValue({
      name: 'Test Env',
      region: 'ap-south-1 (Mumbai) - Default'
    });

    const mockResponse = {
      status: true,
      message: 'Created successfully',
      data: { id: 'env-123', name: 'Test Env', region: 'ap-south-1' }
    };

    const envListResponse = { data: [{ id: 'env-123', name: 'Test Env' }] };

    projectServiceSpy.createEnvironment.and.returnValue(of(mockResponse));
    projectServiceSpy.getEnvironmentsByProject.and.returnValue(of(envListResponse));

    const navigateSpy = spyOn(router, 'navigate');

    component.createEnvironment();

    expect(projectServiceSpy.createEnvironment).toHaveBeenCalledWith('1', { name: 'Test Env', region: 'ap-south-1' });
    expect(toasterSpy.success).toHaveBeenCalledWith('Created successfully');
    expect(sharedServiceSpy.emitEnvDDChange).toHaveBeenCalledWith(envListResponse.data);
    expect(sharedServiceSpy.emitEnvValueChange).toHaveBeenCalledWith(JSON.stringify(mockResponse.data));
    expect(sharedServiceSpy.setCookie).toHaveBeenCalledWith('environment', JSON.stringify(mockResponse.data), 10);
    expect(navigateSpy).toHaveBeenCalledWith(['/project']);
  });

  it('should handle environment creation failure', () => {
    const errorResponse = { status: false, message: 'Failed to create' };

    projectServiceSpy.createEnvironment.and.returnValue(of(errorResponse));

    component.createEnvironment();

    expect(toasterSpy.error).toHaveBeenCalledWith('Environment creation failed');
  });

  it('should not call createEnvironment if form is invalid', () => {
    component.environmentForm.get('name')?.setValue('');
    component.environmentForm.get('name')?.markAsTouched();
    fixture.detectChanges();

    component.createEnvironment();
    expect(projectServiceSpy.createEnvironment).not.toHaveBeenCalled();
  });
});

