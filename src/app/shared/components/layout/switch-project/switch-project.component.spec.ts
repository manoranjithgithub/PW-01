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
  it('should return null when value is null', () => {
    const result = (component as any).safeParse(null);
    expect(result).toBeNull();
  });
  it('should return null when value is "undefined" string', () => {
    const result = (component as any).safeParse('undefined');
    expect(result).toBeNull();
  });
  it('should parse and return object for valid JSON string', () => {
    const json = JSON.stringify({ name: 'test', count: 1 });

    const result = (component as any).safeParse(json);

    expect(result).toEqual({ name: 'test', count: 1 });
  });
  it('should return null when JSON.parse throws error', () => {
    const invalidJson = '{ name: test }';

    const result = (component as any).safeParse(invalidJson);

    expect(result).toBeNull();
  });
  it('getSelectedProject should set projectId, update form and call getRegionsAndEnvironment', () => {
  const proj = { id: '2', name: 'Project2' };
  spyOn(component, 'getRegionsAndEnvironment');
  component.getSelectedProject(proj);
  expect(component.projectId).toBe('2');
  expect(component.form.get('project')?.value).toEqual(proj);
  expect(component.getRegionsAndEnvironment).toHaveBeenCalled();
});

it('getSelectedRegion should set selectedRegion, update form and call getSelectedEnv', () => {
  const region = { name: 'ap-south-1' };
  spyOn(component, 'getSelectedEnv');
  component.getSelectedRegion(region);
  expect(component.selectedRegion).toBe('ap-south-1');
  expect(component.form.get('region')?.value).toEqual(region);
  expect(component.getSelectedEnv).toHaveBeenCalledWith((component as any).getSavedSelections().environment);
});

it('should load regions and environments for selected project (getRegionsAndEnvironment)', fakeAsync(() => {
  // ensure projectId is set
  component.projectId = '1';
  // override service return to include two envs
  projectServiceSpy.getAllEnvironmentsByProject.and.returnValue(of({
    data: [
      { id: 'env1', name: 'Env1', region: 'ap-south-1' },
      { id: 'env2', name: 'Env2', region: 'ap-south-1' }
    ]
  }));
  component.getRegionsAndEnvironment();
  tick();
  expect(projectServiceSpy.getAllEnvironmentsByProject).toHaveBeenCalledWith('1');
  expect(component.listOfenvironments.length).toBe(2);
  expect(component.listOfRegions.length).toBeGreaterThan(0);
  expect(component.listOfRegions[0].environments.length).toBe(2);
}));

it('projectDDChange$ subscription updates listOfProjects and calls getSelectedProject', () => {
  const spy = spyOn(component, 'getSelectedProject');
  component.ngOnInit();
  const projects = [{ id: '1', name: 'Project1' }] as any[];
  projectDDChange$.next(projects);
  expect(component.listOfProjects).toEqual(projects as any);
  expect(spy).toHaveBeenCalledWith(projects[0]);
});

it('envDDChange$ subscription updates listOfenvironments and calls getSelectedEnv', () => {
  const spy = spyOn(component, 'getSelectedEnv');
  component.ngOnInit();
  const envs = [{ id: 'env1', name: 'Env1' }] as any[];
  envDDChange$.next(envs);
  expect(component.listOfenvironments).toEqual(envs as any);
  expect(spy).toHaveBeenCalledWith(envs[0]);
});

it('should return early in getSelectedProject when project is null', () => {
  spyOn(component, 'getRegionsAndEnvironment');

  component.getSelectedProject(null);

  expect(component.getRegionsAndEnvironment).not.toHaveBeenCalled();
});
it('should return early in getSelectedRegion when data is null', () => {
  spyOn(component, 'getSelectedEnv');

  component.getSelectedRegion(null);

  expect(component.getSelectedEnv).not.toHaveBeenCalled();
});
it('should fallback to first region when cookie region not found', () => {
  spyOn(component as any, 'getSavedSelections').and.returnValue({ region: 'unknown' });
  spyOn(component, 'getSelectedRegion');

  component.projectId = '1';

  projectServiceSpy.getAllEnvironmentsByProject.and.returnValue(of({
    data: [{ region: 'ap-south-1' }]
  }));

  component.getRegionsAndEnvironment();

  expect(component.getSelectedRegion).toHaveBeenCalled();
});
});
