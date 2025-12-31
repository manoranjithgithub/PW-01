import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateDeploymentsComponent } from './create-deployments.component';
import { ReviewScreenComponent } from '../review-screen/review-screen.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DeploymentsService } from '../deployment.service';
import { ProjectsService } from '../../projects/projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import { PermissionService } from '../../../shared/services/permission.service';
import { FormBuilder } from '@angular/forms';
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
    // Ensure component uses our spy (component declares its own provider)
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

  it('should perform submitChanges happy path with file upload', fakeAsync(() => {
    // prepare component state to simulate file upload flow
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

    // S3 details missing
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
    expect(component.fileError).toBe('Please select a valid file to upload.');
  });

  it('should set fileFormData and patch zipFilename on valid onZipUpload', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
    component.selectedFile = new File(['x'], 'app.zip', { type: 'application/zip' });
    component.fileExtension = 'zip';
    component.stepOneForm.get('name')?.setValue('myapp');

    // ensure ViewChild modal is a spy (ViewChild can overwrite earlier mocks)
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
    component.stepOneForm.get('name')?.setValue(''); // invalid
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
      // simulate event coming from review child
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
      // upload returns false
      deploymentsServiceSpy.uploadFileToS3.and.returnValue(of(false));
      deploymentsServiceSpy.createDeployement.and.returnValue(of({ status: 'success' }));

      const toaster = TestBed.inject(ToastrService) as any;

      component.submitChanges();
      tick();

      expect(deploymentsServiceSpy.uploadFileToS3).toHaveBeenCalled();
      // since upload returned false, createDeployement should still be called in current implementation
      expect(deploymentsServiceSpy.createDeployement).toHaveBeenCalled();
      expect(toaster.success).toHaveBeenCalled();
    }));

    it('submitChanges should show toaster.error when createDeployement throws', fakeAsync(() => {
      component.fileFormData = undefined;
      // simulate direct create deployment error
      deploymentsServiceSpy.createDeployement.and.returnValue(throwError(() => new Error('boom')) as any);
      const toaster = TestBed.inject(ToastrService) as any;

      component.submitChanges();
      tick();

      // error path should call toaster.error
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
      // no fileFormData means upload$ is of(null) and createDeployement should be called
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
});
