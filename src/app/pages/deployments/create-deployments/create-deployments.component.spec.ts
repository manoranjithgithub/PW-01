import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateDeploymentsComponent } from './create-deployments.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DeploymentsService } from '../deployment.service';
import { ProjectsService } from '../../projects/projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import { PermissionService } from '../../../shared/services/permission.service';
import { FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

describe('CreateDeploymentsComponent', () => {
  let component: CreateDeploymentsComponent;
  let fixture: ComponentFixture<CreateDeploymentsComponent>;
  let deploymentsServiceSpy: jasmine.SpyObj<DeploymentsService>;
  let projectServiceSpy: jasmine.SpyObj<ProjectsService>;
  let sharedServiceSpy: jasmine.SpyObj<SharedService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const currencyChange$ = new Subject<void>();

  beforeEach(async () => {
    const deploymentsSpy = jasmine.createSpyObj('DeploymentsService', [
      'getInstanceTypes',
      'getAvailableRepos',
      'getAvailableBranches',
      'getVCSCallback',
      'getS3Details',
      'uploadFileToS3',
      'createDeployement'
    ]);
    const projectSpy = jasmine.createSpyObj('ProjectsService', ['getProjectDetailsById']);
    const sharedSpy = jasmine.createSpyObj('SharedService', ['getCurrency', 'convertAmount']);
    Object.defineProperty(sharedSpy, 'currencyChange$', { get: () => currencyChange$ });
    const routerJSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CreateDeploymentsComponent],
      providers: [
        FormBuilder,
        { provide: DeploymentsService, useValue: deploymentsSpy },
        { provide: ProjectsService, useValue: projectSpy },
        { provide: SharedService, useValue: sharedSpy },
        { provide: PermissionService, useValue: {} },
        { provide: ToastrService, useValue: { error: jasmine.createSpy('error'), success: jasmine.createSpy('success') } },
        { provide: Router, useValue: routerJSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ]
    }).compileComponents();

    deploymentsServiceSpy = TestBed.inject(DeploymentsService) as jasmine.SpyObj<DeploymentsService>;
    projectServiceSpy = TestBed.inject(ProjectsService) as jasmine.SpyObj<ProjectsService>;
    sharedServiceSpy = TestBed.inject(SharedService) as jasmine.SpyObj<SharedService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    // ensure current project id is present so component calls ProjectsService
    localStorage.setItem('project', JSON.stringify({ id: 'proj1' }));

    fixture = TestBed.createComponent(CreateDeploymentsComponent);
    component = fixture.componentInstance;

    // Mock modals
    component.zipDeploymentModel = { open: jasmine.createSpy('open'), dismiss: jasmine.createSpy('dismiss') } as any;

    deploymentsServiceSpy.getInstanceTypes.and.returnValue(of({ data: [{ instanceType: 'femto.m' }] }));
    projectServiceSpy.getProjectDetailsById.and.returnValue(of({ data: { github: true, gitlab: false } }));

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize currentProjectId and fetch VCS info', fakeAsync(() => {
    tick();
    expect(projectServiceSpy.getProjectDetailsById).toHaveBeenCalled();
    expect(component.vcsProfileInfo.github).toBeTrue();
  }));

  it('should open zip modal on selectedType "zip"', () => {
    const openSpy = spyOn((component as any).zipDeploymentModel, 'open');

    component.selectedType({ value: 'zip' } as any);

    expect(openSpy).toHaveBeenCalled();
  });


  it('should return formatted currency', () => {
    sharedServiceSpy.getCurrency.and.returnValue('USD');
    sharedServiceSpy.convertAmount.and.returnValue(200);
    expect(component.formatCurrency(100)).toBe('$200.00');
  });

  it('should remove file extension correctly', () => {
    component.fileExtension = '';
    const result = component.removeFileExtension('test-file.zip');
    expect(result).toBe('test-file');
    expect(component.fileExtension).toBe('zip');
  });

  it('should validate file correctly', () => {
    const validatorFn = component.fileValidator(['zip']);
    const control = { value: 'file.zip' } as any;
    expect(validatorFn(control)).toBeNull();
    const invalidControl = { value: 'file.txt' } as any;
    expect(validatorFn(invalidControl)).toEqual({ invalidFileType: true });
  });

  it('should build git URL for github', () => {
    component.selectedVCS = 'github';
    component.selectedRepoDetails = { repoUrl: 'repo/name', branchName: 'main', webhook: false, gitRepoId: 0 };
    expect(component['buildGitUrl']()).toBe('https://token@github.com/repo/name.git -b main');
  });

  it('should clean payload', () => {
    const obj = { a: 1, b: null, c: undefined, d: '' };
    const result = component.cleanPayload(obj);
    expect(result).toEqual({ a: 1 });
  });
});
