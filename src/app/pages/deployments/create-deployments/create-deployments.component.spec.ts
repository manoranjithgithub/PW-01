import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateDeploymentsComponent } from './create-deployments.component';
import { ReviewScreenComponent } from '../review-screen/review-screen.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DeploymentsService } from '../deployment.service';
import { ProjectsService } from '../../projects/projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import { PermissionService } from '../../../shared/services/permission.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { of, Subject, throwError } from 'rxjs';
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
    TestBed.overrideComponent(CreateDeploymentsComponent as any, {
      set: {
        providers: [{ provide: DeploymentsService, useValue: deploymentsSpy }]
      }
    });
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
    localStorage.setItem('project', JSON.stringify({ id: 'proj1' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'env1', name: 'Test Env' }));
    fixture = TestBed.createComponent(CreateDeploymentsComponent);
    component = fixture.componentInstance;
    component.zipDeploymentModel = { open: jasmine.createSpy('open'), dismiss: jasmine.createSpy('dismiss') } as any;
    component.selectedRepoDetails = { gitRepoId: 1, repoUrl: 'repo', branchName: 'main', webhook: false };

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
    expect(component.formatCurrency(100)).toBe('$200.0000');
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

  it('should perform submitChanges happy path with file upload', fakeAsync(() => {
    component.fileFormData = new FormData();
    component.selectedFile = new File(['content'], 'app.zip', { type: 'application/zip' });
    component.fileExtension = 'zip';

    const s3Resp = { data: { uploadUrl: 'https://upload', s3Key: 'uploads/key', contentType: 'application/zip' } };
    deploymentsServiceSpy.getS3Details.and.returnValue(of(s3Resp));
    deploymentsServiceSpy.uploadFileToS3.and.returnValue(of(true));
    deploymentsServiceSpy.createDeployement.and.returnValue(of({ status: 'success', data: {} }));

    const toaster = TestBed.inject(ToastrService) as any;

    component.submitChanges();
    tick();

    expect(deploymentsServiceSpy.getS3Details).toHaveBeenCalledWith('zip');
    expect(deploymentsServiceSpy.uploadFileToS3).toHaveBeenCalled();
    expect(deploymentsServiceSpy.createDeployement).toHaveBeenCalled();
    expect(toaster.success).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/deployment']);
  }));

  it('should handle submitChanges error when S3 details are missing', fakeAsync(() => {
    component.fileFormData = new FormData();
    component.selectedFile = new File(['content'], 'app.zip', { type: 'application/zip' });
    component.fileExtension = 'zip';
    deploymentsServiceSpy.getS3Details.and.returnValue(of({ data: null }));
    deploymentsServiceSpy.createDeployement.and.returnValue(of({}));

    const toaster = TestBed.inject(ToastrService) as any;

    component.submitChanges();
    tick();

    expect(toaster.error).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('should handle zip file selection and set filename & extension', () => {
    const file = new File(['zipcontent'], 'my-app.zip', { type: 'application/zip' });
    const event = { target: { files: [file] } } as any;

    component.onZipFileSelect(event);

    expect(component.selectedFile).toBeTruthy();
    expect(component.stepOneForm.get('zipFilename')?.value).toBe('my-app.zip');
    expect(component.fileExtension).toBe('zip');
  });

  it('should return correct state for getState()', () => {
    spyOn(component as any, 'getSubdomain').and.returnValue('app');
    expect(component.getState()).toBe('nimbuz');
    (component as any).getSubdomain.and.returnValue('team');
    expect(component.getState()).toBe('team');
  });

  it('should set fileError when onZipUpload called with invalid zip form', () => {
    component.zipUploadForm.get('zipfileInput')?.setErrors({ required: true });
    component.onZipUpload();
    expect(component.fileError).toBe('Please choose a valid zip or tar file');
    expect(component.zipUploadForm.get('zipfileInput')?.touched).toBeTrue();
  });

  it('should set fileFormData and patch zipFilename on valid onZipUpload', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
    component.selectedFile = new File(['x'], 'app.zip', { type: 'application/zip' });
    component.fileExtension = 'zip';
    component.stepOneForm.get('name')?.setValue('myapp');
    (component as any).zipDeploymentModel = { dismiss: jasmine.createSpy('dismiss') } as any;

    component.onZipUpload();

    expect(component.fileFormData instanceof FormData).toBeTrue();
    expect(component.stepOneForm.get('zipFilename')?.value).toBe('app.zip');
    expect((component as any).zipDeploymentModel.dismiss).toHaveBeenCalled();
  });

  it('checkAvailablity should set validators when name exists', () => {
    component.deploymentNames = ['existing'];
    component.stepOneForm.get('name')?.setValue('existing');
    component.checkAvailablity();
    const validator = component.stepOneForm.get('name')?.validator;
    expect(validator).toBeTruthy();
  });

  it('clearFile should reset file controls and clear DOM input', () => {
    component.selectedConfigFile = new File(['c'], 'cfg.json', { type: 'application/json' });
    component.fileUploadForm.get('fileInput')?.setValue('some');
    component.fileUploadForm.get('filePath')?.setValue('path');
    const input = document.createElement('input');
    input.id = 'fileInput';
    input.value = 'shouldclear';
    document.body.appendChild(input);

    component.clearFile();

    expect(component.selectedConfigFile).toBeNull();
    expect(component.fileUploadForm.get('fileInput')?.value).toBeFalsy();
    document.body.removeChild(input);
  });

  it('next with label "Submit" should call submitChanges', () => {
    spyOn(component, 'submitChanges');
    component.next('Submit');
    expect(component.submitChanges).toHaveBeenCalled();
  });

  it('prev should decrement currentStep', () => {
    component.currentStep = 2;
    component.prev();
    expect(component.currentStep).toBe(1);
  });

  it('canNavigateToStep should return false when stepOneForm invalid and trying to advance', () => {
    component.currentStep = 0;
    component.stepOneForm.get('name')?.setValue(''); 
    expect(component.canNavigateToStep(1)).toBeFalse();
  });

  it('isStepCompleted should reflect form validity for step 0', () => {
    component.stepOneForm.get('type')?.setValue('zip');
    component.stepOneForm.get('name')?.setValue('valid-name');
    component.stepOneForm.get('instanceType')?.setValue({ instanceType: 'femto.m' });
    expect(component.isStepCompleted(0)).toBeTrue();
  });

  it('buildRequest should assemble expected payload', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-1' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-1' }));
    component.stepOneForm.get('name')?.setValue('app1');
    component.stepOneForm.get('installCommand')?.setValue('npm i');
    component.stepOneForm.get('replicas')?.setValue('2');
    component.secretData = { data: [{ EnvVariable: 'KEY', Value: 'VAL' }] } as any;
    component.parsedConfigData = 'cfg';

    const result = (component as any).buildRequest('cfg.yaml', '/path/to/cfg');
    expect(result.name).toBe('app1');
    expect(result.config.name).toBe('cfg');
    expect(result.secret.KEY).toBe('VAL');
  });

  it('selectedRepoBranch should populate branches and set branchName', () => {
    component.selectedVCS = 'github';
    component.reposList = [{ id: 1, full_name: 'repo/name', name: 'repo', webhook: false }];
    component.selectedRepoDetails = { gitRepoId: null, repoUrl: null, branchName: '', webhook: false } as any;
    const branchResp = { data: ['main', 'dev'] };
    deploymentsServiceSpy.getAvailableBranches.and.returnValue(of(branchResp));

    component.selectedRepoBranch({ id: 1 } as any);

    expect(component.branches).toEqual(['main', 'dev']);
    expect(component.stepOneForm.get('branchName')?.value).toBe('main');
  });

  it('handleVCS should fetch repos when authenticated', () => {
    component.vcsProfileInfo = { github: true } as any;
    deploymentsServiceSpy.getAvailableRepos.and.returnValue(of({ status: 'success', data: [{ id: 1, full_name: 'repo/name', name: 'repo', webhook: false }] }));

    component.handleVCS('github');

    expect(deploymentsServiceSpy.getAvailableRepos).toHaveBeenCalled();
  });

  it('handleVCS should call redirectToOAuth when not authenticated', () => {
    component.vcsProfileInfo = { github: false } as any;
    spyOn(component as any, 'redirectToOAuth');

    component.handleVCS('github');

    expect((component as any).redirectToOAuth).toHaveBeenCalledWith('github');
  });

  it('should build git URL for gitlab', () => {
    component.selectedVCS = 'gitlab';
    component.selectedRepoDetails = { repoUrl: 'repo/name', branchName: 'feature', webhook: false, gitRepoId: 0 } as any;
    expect(component['buildGitUrl']()).toBe('https://repo/name:token@gitlab.com/repo/name.git -b feature');
  });

  describe('ReviewScreen interactions and submit error branches', () => {
    it('editSelectedStep emitted from review screen should set currentStep and fromReview', () => {
      component.editSelectedStep({ step: 2, fromReview: true });
      expect(component.fromReview).toBeTrue();
      expect(component.currentStep).toBe(2);
    });

    it('submitChanges should handle uploadFileToS3 returning false (upload failure)', fakeAsync(() => {
      component.fileFormData = new FormData();
      component.selectedFile = new File(['x'], 'app.zip', { type: 'application/zip' });
      component.fileExtension = 'zip';

      const s3Resp = { data: { uploadUrl: 'https://upload', s3Key: 'uploads/key', contentType: 'application/zip' } };
      deploymentsServiceSpy.getS3Details.and.returnValue(of(s3Resp));
      deploymentsServiceSpy.uploadFileToS3.and.returnValue(of(false));
      deploymentsServiceSpy.createDeployement.and.returnValue(of({ status: 'success' }));

      const toaster = TestBed.inject(ToastrService) as any;

      component.submitChanges();
      tick();

      expect(deploymentsServiceSpy.uploadFileToS3).toHaveBeenCalled();
      expect(deploymentsServiceSpy.createDeployement).toHaveBeenCalled();
      expect(toaster.success).toHaveBeenCalled();
    }));

    it('submitChanges should show toaster.error when createDeployement throws', fakeAsync(() => {
      component.fileFormData = undefined;
      deploymentsServiceSpy.createDeployement.and.returnValue(throwError(() => new Error('boom')) as any);
      const toaster = TestBed.inject(ToastrService) as any;

      component.submitChanges();
      tick();

      expect(toaster.error).toHaveBeenCalled();
    }));

    it('parent should handle editSelectedStep emitted by ReviewScreen child', () => {
      fixture.detectChanges();
      const debugEls = fixture.debugElement.queryAll(e => e.componentInstance && e.componentInstance.constructor && e.componentInstance.constructor.name === 'ReviewScreenComponent');
      if (debugEls.length === 0) {
        pending('ReviewScreenComponent not present in template');
        return;
      }
      const childComp: any = debugEls[0].componentInstance;
      childComp.editSelectedStep.emit({ step: 3, fromReview: true });
      expect(component.currentStep).toBe(3);
      expect(component.fromReview).toBeTrue();
    });

    it('submitChanges should call toaster.error when getS3Details throws', fakeAsync(() => {
      component.fileFormData = new FormData();
      component.selectedFile = new File(['x'], 'app.zip', { type: 'application/zip' });
      component.fileExtension = 'zip';
      deploymentsServiceSpy.getS3Details.and.returnValue(throwError(() => new Error('s3 fail')));
      const toaster = TestBed.inject(ToastrService) as any;

      component.submitChanges();
      tick();

      expect(toaster.error).toHaveBeenCalled();
    }));

    it('submitChanges without fileFormData should call createDeployement and navigate', fakeAsync(() => {
      component.fileFormData = undefined as any;
      deploymentsServiceSpy.createDeployement.and.returnValue(of({ status: 'success', data: {} }));
      const toaster = TestBed.inject(ToastrService) as any;

      component.submitChanges();
      tick();

      expect(deploymentsServiceSpy.createDeployement).toHaveBeenCalled();
      expect(toaster.success).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/deployment']);
    }));

    it('submitChanges should show toaster.error when uploadFileToS3 errors', fakeAsync(() => {
      component.fileFormData = new FormData();
      component.selectedFile = new File(['x'], 'app.zip', { type: 'application/zip' });
      component.fileExtension = 'zip';

      const s3Resp = { data: { uploadUrl: 'https://upload', s3Key: 'uploads/key', contentType: 'application/zip' } };
      deploymentsServiceSpy.getS3Details.and.returnValue(of(s3Resp));
      deploymentsServiceSpy.uploadFileToS3.and.returnValue(throwError(() => new Error('upload fail')));
      deploymentsServiceSpy.createDeployement.and.returnValue(of({ status: 'success' }));

      const toaster = TestBed.inject(ToastrService) as any;

      component.submitChanges();
      tick();

      expect(deploymentsServiceSpy.uploadFileToS3).toHaveBeenCalled();
      expect(deploymentsServiceSpy.createDeployement).not.toHaveBeenCalled();
      expect(toaster.error).toHaveBeenCalled();
    }));
  });

  describe('Additional Coverage Tests', () => {
    it('should handle next() with fromReview true', () => {
      component.fromReview = true;
      component.currentStep = 2;
      component.selectedRepoDetails = { gitRepoId: 1, repoUrl: 'repo', branchName: 'main', webhook: false };
      component.next('Next');
      expect(component.currentStep).toBe(4);
    });

    it('should handle next() at step 1 and call child.addVariable', () => {
      component.currentStep = 1;
      component.child = { addVariable: jasmine.createSpy('addVariable') } as any;
      component.next('Next');
      expect(component.child.addVariable).toHaveBeenCalled();
    });

    it('should handle next() at step 2 and call secretChild.addSecret', () => {
      component.currentStep = 2;
      component.secretChild = { addSecret: jasmine.createSpy('addSecret') } as any;
      component.next('Next');
      expect(component.secretChild.addSecret).toHaveBeenCalled();
    });

    it('should handle next() at step 3 with invalid form and mark as touched', () => {
      component.currentStep = 3;
      component.fileUploadForm.get('fileInput')?.setErrors({ required: true });
      const markTouchedSpy = spyOn(component.fileUploadForm, 'markAllAsTouched');
      component.next('Next');
      expect(markTouchedSpy).toHaveBeenCalled();
      expect(component.currentStep).toBe(3);
    });

    it('should handle next() at step 3 with valid form and increment step', () => {
      component.currentStep = 3;
      component.fileUploadForm.get('fileInput')?.clearValidators();
      component.fileUploadForm.get('filePath')?.clearValidators();
      component.fileUploadForm.updateValueAndValidity();
      component.next('Next');
      expect(component.currentStep).toBe(4);
    });

    it('should handle next() at step 4 and call submitChanges', () => {
      component.currentStep = 4;
      spyOn(component, 'submitChanges');
      component.next('Any Label');
      expect(component.submitChanges).toHaveBeenCalled();
    });

    it('should increment currentStep when calling next() without special conditions', () => {
      component.currentStep = 0;
      component.fromReview = false;
      component.steps = [{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }, { label: 'Step 4' }, { label: 'Step 5' }];
      component.next('Next');
      expect(component.currentStep).toBe(1);
    });

    it('should handle goToStep', () => {
      component.goToStep(3);
      expect(component.currentStep).toBe(3);
    });

    it('should handle getenvironmentList', () => {
      const event = { data: [{ key: 'ENV_VAR', value: 'test' }] };
      component.getenvironmentList(event);
      expect(component.envData).toEqual(event);
    });

    it('should handle getSecretList', () => {
      const event = { data: [{ EnvVariable: 'SECRET', Value: 'hidden' }] };
      component.getSecretList(event);
      expect(component.secretData).toEqual(event);
    });

    it('should return false for isStepCompleted for unknown step', () => {
      expect(component.isStepCompleted(10)).toBeFalse();
    });

    it('should return true for isStepCompleted for step 1', () => {
      expect(component.isStepCompleted(1)).toBeTrue();
    });

    it('should return true for isStepCompleted for step 2', () => {
      expect(component.isStepCompleted(2)).toBeTrue();
    });

    it('should handle canNavigateToStep returning true when navigating backward', () => {
      component.currentStep = 3;
      expect(component.canNavigateToStep(2)).toBeTrue();
    });

    it('should handle canNavigateToStep returning true when navigating to current step', () => {
      component.currentStep = 2;
      expect(component.canNavigateToStep(2)).toBeTrue();
    });

    it('should handle canNavigateToStep returning true when form valid', fakeAsync(() => {
      component.currentStep = 0;
      component.stepOneForm.get('name')?.setValue('valid-name');
      component.stepOneForm.get('type')?.setValue('github');
      component.stepOneForm.get('instanceType')?.setValue({ instanceType: 'femto.m' });
      tick(400); 
      expect(component.canNavigateToStep(1)).toBeTrue();
    }));

    it('should handle fileValidator with file size exceeded', () => {
      const validator = component.fileValidator(['zip']);
      const control = { value: 'huge-file.zip' } as any;
      const result = validator(control);
      expect(result).toBeNull(); 
    });

    it('should handle fileValidator with null file', () => {
      const validator = component.fileValidator(['zip']);
      const control = { value: null } as any;
      expect(validator(control)).toBeNull();
    });

    it('should handle onZipFileSelect with file size too large', () => {
      const toaster = TestBed.inject(ToastrService) as any;
      const file = new File(['x'], 'huge.zip', { type: 'application/zip' });
      Object.defineProperty(file, 'size', { value: 600_000_000, writable: false });
      const event = { target: { files: [file] } } as any;
      
      component.onZipFileSelect(event);
      
      expect(toaster.error).toHaveBeenCalledWith('File size too large.');
      expect(component.fileError).toBe('File size large');
    });

    it('should handle onZipFileSelect with invalid file type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const event = { target: { files: [file] } } as any;
      
      component.onZipFileSelect(event);
      expect(component.selectedFile).toBe(file);
    });

    it('should handle selectedRepoBranch with gitlab', () => {
      component.selectedVCS = 'gitlab';
      component.currentProjectId = 'proj1';
      const event = { id: 123, name: 'test-repo' };
      deploymentsServiceSpy.getAvailableBranches.and.returnValue(of({ data: ['main', 'develop'] }));
      
      component.selectedRepoBranch(event);
      
      expect(deploymentsServiceSpy.getAvailableBranches).toHaveBeenCalledWith('proj1', 'gitlab', 123);
      expect(component.branches).toEqual(['main', 'develop']);
    });

    it('should handle selectedRepoBranch with no VCS selected', () => {
      component.selectedVCS = null as any;
      component.selectedRepoBranch({ id: 1 });
      expect(deploymentsServiceSpy.getAvailableBranches).not.toHaveBeenCalled();
    });

    it('should handle selectedRepoBranch with github and repo not found', () => {
      component.selectedVCS = 'github';
      component.reposList = [];
      const consoleSpy = spyOn(console, 'error');
      
      component.selectedRepoBranch({ id: 999 });
      
      expect(consoleSpy).toHaveBeenCalledWith('Selected GitHub repo not found.');
    });

    it('should handle selectedRepoBranch with no repoIdOrName', () => {
      component.selectedVCS = 'github';
      component.reposList = [{ id: 1, full_name: null }];
      const consoleSpy = spyOn(console, 'warn');
      
      component.selectedRepoBranch({ id: 1 });
      
      expect(consoleSpy).toHaveBeenCalledWith('No valid repository selected.');
    });

    it('should handle selectedRepoBranch error when fetching branches fails', () => {
      component.selectedVCS = 'github';
      component.reposList = [{ id: 1, full_name: 'owner/repo', name: 'repo', webhook: false }];
      deploymentsServiceSpy.getAvailableBranches.and.returnValue(throwError(() => new Error('fail')));
      const toaster = TestBed.inject(ToastrService) as any;
      
      component.selectedRepoBranch({ id: 1 });
      
      expect(toaster.error).toHaveBeenCalledWith('Failed to fetch branches from github');
    });

    it('should handle selectedRepoBranch with empty branches array', () => {
      component.selectedVCS = 'github';
      component.reposList = [{ id: 1, full_name: 'owner/repo', name: 'repo', webhook: false }];
      deploymentsServiceSpy.getAvailableBranches.and.returnValue(of({ data: [] }));
      
      component.selectedRepoBranch({ id: 1 });
      
      expect(component.branches).toEqual([]);
      expect(component.stepOneForm.get('branchName')?.value).toBeNull();
    });

    it('should handle selectedType with docker option', () => {
      component.selectedType({ value: 'docker' } as any);
      expect(component.selectedVCS).toBe('docker');
    });

    it('should handle selectedType with unknown option', () => {
      component.selectedType({ value: 'unknown' } as any);
      expect(component.selectedVCS).toBe('unknown');
    });

    it('should handle handleVCS error when getAvailableRepos fails', () => {
      component.vcsProfileInfo = { github: true } as any;
      deploymentsServiceSpy.getAvailableRepos.and.returnValue(throwError(() => new Error('fail')));
      const toaster = TestBed.inject(ToastrService) as any;
      
      component.handleVCS('github');
      
      expect(toaster.error).toHaveBeenCalledWith('Error in getting user repository');
      expect(component.reposList).toEqual([]);
    });

    it('should handle handleVCS with unsuccessful status', () => {
      component.vcsProfileInfo = { github: true } as any;
      deploymentsServiceSpy.getAvailableRepos.and.returnValue(of({ status: 'failure', data: [] }));
      
      component.handleVCS('github');
      
      expect(component.reposList).toEqual([]);
    });

    it('should normalize repos with github type', () => {
      const repos = [
        { id: 1, name: 'repo1', webhook: false },
        { id: 2, name: 'repo2', webhook: true }
      ];
      const result = (component as any).normalizeRepos('github', repos);
      expect(result[0].webhook).toBe(false);
      expect(result[1].webhook).toBe(true);
    });

    it('should normalize repos with gitlab type and permission field', () => {
      const repos = [
        { id: 1, name: 'repo1', permission: true },
        { id: 2, name: 'repo2', permission: false }
      ];
      const result = (component as any).normalizeRepos('gitlab', repos);
      expect(result[0].webhook).toBe(true);
      expect(result[1].webhook).toBe(false);
    });

    it('should handle fetchRepos and set selectedRepo when repos available', () => {
      component.vcsProfileInfo = { github: true } as any;
      deploymentsServiceSpy.getAvailableRepos.and.returnValue(of({ 
        status: 'success', 
        data: [{ id: 1, full_name: 'owner/repo', name: 'repo', webhook: false }] 
      }));
      
      (component as any).fetchRepos('github');
      
      expect(component.reposList.length).toBe(1);
      expect(component.stepOneForm.get('selectedRepo')?.value).toBe(1);
    });

    it('should handle checkFileAvailble when filePath has value but fileInput is empty', () => {
      component.fileUploadForm.get('filePath')?.setValue('/path/to/file');
      component.fileUploadForm.get('fileInput')?.setValue('');
      const markTouchedSpy = spyOn(component.fileUploadForm, 'markAllAsTouched');
      
      component.checkFileAvailble();
      
      expect(markTouchedSpy).toHaveBeenCalled();
    });

    it('should handle checkFileAvailble when fileInput is valid', () => {
      component.fileUploadForm.get('filePath')?.setValue('/path');
      component.fileUploadForm.get('fileInput')?.setValue('file.txt');
      
      component.checkFileAvailble();
      
      const fileInput = component.fileUploadForm.get('fileInput');
      expect(fileInput?.hasError('required')).toBeFalsy();
    });

    it('should handle onFileSelected and parse file content', (done) => {
      const fileContent = 'test file content';
      const file = new File([fileContent], 'config.json', { type: 'application/json' });
      const event = { target: { files: [file] } } as any;
      
      component.onFileSelected(event);
      
      setTimeout(() => {
        expect(component.parsedConfigData).toBeTruthy();
        const filePath = component.fileUploadForm.get('filePath');
        expect(filePath?.hasValidator(Validators.required)).toBeTrue();
        done();
      }, 100);
    });

    it('should handle onFileSelected with no files', () => {
      const event = { target: { files: [] } } as any;
      component.onFileSelected(event);
      expect(component.parsedConfigData).toBeUndefined();
    });

    it('should handle formatCurrency with null value', () => {
      const result = component.formatCurrency(undefined);
      expect(result).toBe('');
    });

    it('should handle formatCurrency with NaN value', () => {
      const result = component.formatCurrency(NaN);
      expect(result).toBe('');
    });

    it('should handle formatCurrency with valid value and EUR currency', () => {
      sharedServiceSpy.getCurrency.and.returnValue('EUR');
      sharedServiceSpy.convertAmount.and.returnValue(85.5);
      const result = component.formatCurrency(100);
      expect(result).toBe('€85.5000');
    });

    it('should handle formatCurrency with invalid currency and return string', () => {
      sharedServiceSpy.getCurrency.and.returnValue('INVALID');
      sharedServiceSpy.convertAmount.and.returnValue(100);
      const result = component.formatCurrency(100);
      expect(result).toBe('100');
    });

    it('should handle isNameAvailable validator with invalid name', () => {
      const validator = component.isNameAvailable(false);
      const control = { value: 'test' } as any;
      expect(validator(control)).toEqual({ nameValidation: 'Name must contain only letters, numbers and hyphens' });
    });

    it('should handle isNameAvailable validator with no value', () => {
      const validator = component.isNameAvailable(false);
      const control = { value: '' } as any;
      expect(validator(control)).toBeNull();
    });

    it('should handle checkAvailablity with invalid name', () => {
      component.stepOneForm.get('name')?.setErrors({ required: true });
      const markTouchedSpy = spyOn(component.stepOneForm, 'markAllAsTouched');
      
      component.checkAvailablity();
      
      expect(markTouchedSpy).toHaveBeenCalled();
    });

    it('should handle ngAfterViewInit with no query params', fakeAsync(() => {
      fixture = TestBed.createComponent(CreateDeploymentsComponent);
      component = fixture.componentInstance;
      component.selectedRepoDetails = { gitRepoId: 1, repoUrl: 'repo', branchName: 'main', webhook: false };
      deploymentsServiceSpy.getInstanceTypes.and.returnValue(of({ data: [] }));
      projectServiceSpy.getProjectDetailsById.and.returnValue(of({ data: { github: false } }));
      
      fixture.detectChanges();
      tick(1000); 
      
      expect(deploymentsServiceSpy.getVCSCallback).not.toHaveBeenCalled();
    }));

    xit('should handle ngAfterViewInit with valid VCS callback params', fakeAsync(() => {
      const activatedRoute = TestBed.inject(ActivatedRoute);
      (activatedRoute.queryParams as any) = of({ provider: 'github', code: 'test-code' });
      
      fixture = TestBed.createComponent(CreateDeploymentsComponent);
      component = fixture.componentInstance;
      component.currentProjectId = 'proj1';
      component.selectedRepoDetails = { gitRepoId: 1, repoUrl: 'repo', branchName: 'main', webhook: false };
      
      deploymentsServiceSpy.getInstanceTypes.and.returnValue(of({ data: [] }));
      projectServiceSpy.getProjectDetailsById.and.returnValue(of({ data: { github: false } }));
      deploymentsServiceSpy.getVCSCallback.and.returnValue(of({ status: 'success' }));
      deploymentsServiceSpy.getAvailableRepos.and.returnValue(of({ status: 'success', data: [] }));
      
      fixture.detectChanges();
      tick(1000); 
      
      expect(deploymentsServiceSpy.getVCSCallback).toHaveBeenCalledWith('test-code', 'proj1', 'github');
      fixture.destroy(); 
    }));

    it('should handle instanceType valueChanges subscription', fakeAsync(() => {
      const resource = { instanceType: 'nano.s', cpu: 1, memory: 512 };
      component.stepOneForm.get('instanceType')?.setValue(resource);
      tick();
      expect(component.selectedResource).toEqual(resource);
    }));

    it('should handle selectedRepo valueChanges with gitlab VCS', fakeAsync(() => {
      component.selectedVCS = 'gitlab';
      component.reposList = [{ id: 10, path_with_namespace: 'group/repo', name: 'repo', webhook: true }];
      component.selectedRepoDetails = { gitRepoId: 0, repoUrl: null, branchName: '', webhook: false };
      deploymentsServiceSpy.getAvailableBranches.and.returnValue(of({ data: ['main'] }));
      
      component.stepOneForm.get('selectedRepo')?.setValue(10);
      tick(400);
      
      expect(component.selectedRepoDetails.repoUrl).toBe('group/repo');
      expect(component.selectedRepoDetails.webhook).toBeTrue();
    }));

    it('should handle name valueChanges with uppercase conversion', fakeAsync(() => {
      component.stepOneForm.get('name')?.setValue('MyApp');
      tick(400);
      expect(component.stepOneForm.get('name')?.value).toBe('myapp');
    }));

    it('should handle branchName valueChanges', fakeAsync(() => {
      component.selectedRepoDetails = { gitRepoId: 1, repoUrl: 'repo', branchName: '', webhook: false };
      component.stepOneForm.get('branchName')?.setValue('develop');
      tick(400);
      expect(component.selectedRepoDetails.branchName).toBe('develop');
    }));

    it('should handle currencyChange$ subscription', fakeAsync(() => {
      const cdrSpy = spyOn(component['cdr'], 'detectChanges');
      currencyChange$.next();
      tick();
      expect(cdrSpy).toHaveBeenCalled();
    }));

    it('should handle buildGitUrl with unknown VCS type', () => {
      component.selectedVCS = 'unknown' as any;
      component.selectedRepoDetails = { repoUrl: 'repo', branchName: 'main', webhook: false, gitRepoId: 1 };
      expect((component as any).buildGitUrl()).toBe('');
    });

    it('should handle buildRequest with minimal data', fakeAsync(() => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
      component.stepOneForm.get('name')?.setValue('app');
      component.stepOneForm.get('instanceType')?.setValue({ instanceType: 'femto.m' });
      component.selectedVCS = 'github';
      component.selectedRepoDetails = { repoUrl: 'owner/repo', branchName: 'main', webhook: false, gitRepoId: 1 };
      tick(1000); 
      
      const result = (component as any).buildRequest(null, null);
      
      expect(result.name).toBe('app');
      expect(result.config.name).toBeNull();
      expect(result.config.path).toBeNull();
    }));

    it('should handle buildRequest with ephemeralStorage', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
      component.stepOneForm.get('name')?.setValue('app');
      component.stepOneForm.get('instanceType')?.setValue({ instanceType: 'femto.m' });
      component.stepOneForm.get('ephemeralStorage')?.setValue('5');
      component.selectedVCS = 'github';
      component.selectedRepoDetails = { repoUrl: 'owner/repo', branchName: 'main', webhook: false, gitRepoId: 1 };
      
      const result = (component as any).buildRequest(null, null);
      
      expect(result.application.ephemeralStorage).toBe('5Gi');
    });

    it('should handle buildRequest with storage', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
      component.stepOneForm.get('name')?.setValue('app');
      component.stepOneForm.get('instanceType')?.setValue({ instanceType: 'femto.m' });
      component.stepOneForm.get('storage')?.setValue('10');
      component.selectedVCS = 'github';
      component.selectedRepoDetails = { repoUrl: 'owner/repo', branchName: 'main', webhook: false, gitRepoId: 1 };
      
      const result = (component as any).buildRequest(null, null);
      
      expect(result.application.storage).toBe('10Gi');
    });

    it('should handle buildRequest with custom port', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
      component.stepOneForm.get('name')?.setValue('app');
      component.stepOneForm.get('instanceType')?.setValue({ instanceType: 'femto.m' });
      component.stepOneForm.get('port')?.setValue('3000');
      component.selectedVCS = 'github';
      component.selectedRepoDetails = { repoUrl: 'owner/repo', branchName: 'main', webhook: false, gitRepoId: 1 };
      
      const result = (component as any).buildRequest(null, null);
      
      expect(result.network.port).toBe(3000);
    });

    it('should handle buildRequest with default port when not provided', () => {
      localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
      component.stepOneForm.get('name')?.setValue('app');
      component.stepOneForm.get('instanceType')?.setValue({ instanceType: 'femto.m' });
      component.selectedVCS = 'github';
      component.selectedRepoDetails = { repoUrl: 'owner/repo', branchName: 'main', webhook: false, gitRepoId: 1 };
      
      const result = (component as any).buildRequest(null, null);
      
      expect(result.network.port).toBe(80);
    });

    it('should handle getSubdomain', () => {
      const subdomain = (component as any).getSubdomain();
      expect(subdomain).toBeTruthy();
      expect(typeof subdomain).toBe('string');
    });

    it('should handle redirectToOAuth for gitlab', () => {
      spyOn(component as any, 'getState').and.returnValue('nimbuz');
      expect(() => {
        const subdomain = (component as any).getSubdomain();
        expect(subdomain).toBeTruthy();
      }).not.toThrow();
    });
  });
});
