import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SwitchProjectComponent } from './switch-project.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProjectsService } from '../../../../pages/projects/projects.service';
import { SharedService } from '../../../services/shared.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { toastConfigMock, createToastrSpy } from '../../../../../test-helpers/testing-mocks';
import { FormBuilder } from '@angular/forms';
import { DeploymentsService } from '../../../services/deployments.service';
import { of, Subject } from 'rxjs';
import { ModalComponent } from '../../model/model.component';

describe('SwitchProjectComponent', () => {
  let component: SwitchProjectComponent;
  let fixture: ComponentFixture<SwitchProjectComponent>;
  let projectServiceSpy: jasmine.SpyObj<ProjectsService>;
  let sharedServiceSpy: jasmine.SpyObj<SharedService>;

  const projectDDChange$ = new Subject<any[]>();
  const envDDChange$ = new Subject<any[]>();

  beforeEach(async () => {
    const projectSpy = jasmine.createSpyObj('ProjectsService', [
      'getAllProjects', 
      'getAllEnvironmentsByProject', 
      'getProjectDetailsById'
    ]);
    const sharedSpy = jasmine.createSpyObj('SharedService', [
      'emitProjectValueChange', 
      'emitEnvValueChange'
    ]);
    Object.defineProperty(sharedSpy, 'projectDDChange$', { get: () => projectDDChange$ });
    Object.defineProperty(sharedSpy, 'envDDChange$', { get: () => envDDChange$ });

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SwitchProjectComponent, ModalComponent],
      providers: [
        FormBuilder,
        { provide: ProjectsService, useValue: projectSpy },
        { provide: SharedService, useValue: sharedSpy },
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
        { provide: ToastrService, useValue: createToastrSpy() },
        { provide: AuthService, useValue: {} }
      ]
    });

    TestBed.overrideComponent(SwitchProjectComponent as any, {
      set: {
        providers: [
          { provide: ProjectsService, useValue: projectSpy },
          { provide: DeploymentsService, useValue: {} }
        ]
      }
    });
    projectSpy.getAllProjects.and.returnValue(of({ data: [{ id: '1', name: 'Project1' }] }));
    projectSpy.getAllEnvironmentsByProject.and.returnValue(of({ data: [{ id: 'env1', name: 'Env1', region: 'ap-south-1' }] }));
    projectSpy.getProjectDetailsById.and.returnValue(of({ data: { github: 'github', gitlab: 'gitlab' } }));

    await TestBed.compileComponents();

    projectServiceSpy = TestBed.inject(ProjectsService) as jasmine.SpyObj<ProjectsService>;
    sharedServiceSpy = TestBed.inject(SharedService) as jasmine.SpyObj<SharedService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.showEnvironmentModel = { open: jasmine.createSpy('open'), close: jasmine.createSpy('close') } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load basic info on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(projectServiceSpy.getAllProjects).toHaveBeenCalled();
    expect(component.selectedProject).toBe('Project1');
  }));

  it('should open environment modal', () => {
    component.showEnvironment();
    expect(component.showEnvironmentModel.open).toHaveBeenCalled();
  });

  it('should close environment modal and reload basic info', () => {
    spyOn(component, 'getBasicInfo');
    component.closeModal();
    expect(component.getBasicInfo).toHaveBeenCalled();
    expect(component.showEnvironmentModel.close).toHaveBeenCalled();
  });

  it('should update environment selection', fakeAsync(() => {
    component.form.patchValue({ project: { id: '1', name: 'Project1' } });
    component.selectedEnvironmentObj = { id: 'env1', name: 'Env1' };
    component.updateEnvSelection();
    tick();

    expect(sharedServiceSpy.emitProjectValueChange).toHaveBeenCalledWith(jasmine.objectContaining({ id: '1', name: 'Project1' }));
    expect(sharedServiceSpy.emitEnvValueChange).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'env1', name: 'Env1' }));
    expect(component.vcsProfileInfo.github).toBe('github');
    expect(component.showEnvironmentModel.close).toHaveBeenCalled();
  }));

  it('should determine if environment is selected', () => {
    component.selectedEnvironmentObj = { name: 'Env1' };
    expect(component.isSelectedEnv({ name: 'Env1' })).toBeTrue();
    expect(component.isSelectedEnv({ name: 'Env2' })).toBeFalse();
  });

});
