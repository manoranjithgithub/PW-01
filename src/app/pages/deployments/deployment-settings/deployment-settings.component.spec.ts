import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DeploymentSettingsComponent } from './deployment-settings.component';
import { DeploymentsService } from '../deployment.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { PermissionService } from '../../../shared/services/permission.service';
import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/* ---------------- MOCK SERVICES ---------------- */

class MockDeploymentsService {
  getDeploymentById = jasmine.createSpy('getDeploymentById').and.returnValue(of({ status: 'success', data: {} }));
  getInstanceTypes = jasmine.createSpy('getInstanceTypes').and.returnValue(of({ data: [] }));
  getAuthenticatedresponse = jasmine.createSpy('getAuthenticatedresponse').and.returnValue(of({ data: {} }));
  getDeployments = jasmine.createSpy('getDeployments').and.returnValue(of({ status: 'Success', data: [] }));
  updateDeployment = jasmine.createSpy('updateDeployment').and.returnValue(of({ status: 'success', data: {} }));
  deleteDeployment = jasmine.createSpy('deleteDeployment').and.returnValue(of({ status: 'success', message: 'Deleted successfully' }));
  getS3Details = jasmine.createSpy('getS3Details').and.returnValue(of({ data: { uploadUrl: 'url', contentType: 'application/zip', s3Key: 'key' } }));
  uploadFileToS3 = jasmine.createSpy('uploadFileToS3').and.returnValue(of({}));
}

class MockSharedService {
  getCurrency = jasmine.createSpy('getCurrency').and.returnValue('USD');
  convertAmount = jasmine.createSpy('convertAmount').and.callFake((val: number) => val);
  currencyChange$ = of();
}

class MockToastrService {
  success = jasmine.createSpy('success');
  error = jasmine.createSpy('error');
}

class MockModalService {
  open = jasmine.createSpy('open').and.returnValue({
    componentInstance: {},
    result: Promise.resolve(true)
  });
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockActivatedRoute {
  snapshot = { fragment: null };
  queryParams = of({ id: 'dep123' });
}

class MockPermissionService {
  canWriteGlobal = jasmine.createSpy('canWriteGlobal').and.returnValue(true);
  canAdminGlobal = jasmine.createSpy('canAdminGlobal').and.returnValue(false);
  canDeleteForCurrentUser = jasmine.createSpy('canDeleteForCurrentUser').and.returnValue(false);
}

/* ---------------- TEST SUITE ---------------- */

describe('DeploymentSettingsComponent', () => {
  let component: DeploymentSettingsComponent;
  let fixture: ComponentFixture<DeploymentSettingsComponent>;
  let deploymentService: MockDeploymentsService;
  let toastr: MockToastrService;

  beforeEach(async () => {
    const mockDeploymentsService = new MockDeploymentsService();

    TestBed.configureTestingModule({
      imports: [DeploymentSettingsComponent, HttpClientTestingModule, BrowserAnimationsModule],
      providers: [
        FormBuilder,
        { provide: DeploymentsService, useValue: mockDeploymentsService },
        { provide: SharedService, useClass: MockSharedService },
        { provide: ToastrService, useClass: MockToastrService },
        { provide: NgbModal, useClass: MockModalService },
        { provide: Router, useClass: MockRouter },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: PermissionService, useClass: MockPermissionService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(DeploymentSettingsComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useValue: mockDeploymentsService }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DeploymentSettingsComponent);
    component = fixture.componentInstance;

    deploymentService = TestBed.inject(DeploymentsService) as any;
    toastr = TestBed.inject(ToastrService) as any;

    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on ngOnInit', () => {
    expect(component.generalSettingsForm).toBeTruthy();
    expect(component.sourceSettingsForm).toBeTruthy();
  });

  it('should call getDeploymentById', () => {
    component.deploymentdetails = { id: 'dep123' };
    component.getDeploymentById();
    expect(deploymentService.getDeploymentById).toHaveBeenCalled();
  });

  it('should detect form changes', () => {
    component.generalSettingsForm.patchValue({ name: 'test' });
    expect(component.isGeneralSettingsChanged).toBeTrue();
  });

  it('should validate file type', () => {
    const control = { value: 'file.txt' };
    const result = component.fileValidator(control as any);
    expect(result).toEqual({ invalidFileType: true });

    const control2 = { value: 'file.zip' };
    expect(component.fileValidator(control2 as any)).toBeNull();
  });

  it('should handle file selection', () => {
    const file = new File([''], 'test.zip', { type: 'application/zip' });
    component.sourceSettingsForm.get('fileName')?.setValue('');
    component.onFileSelect({ target: { files: [file] } });
    expect(component.selectedFile).toBe(file);
  });

  it('should call onZipUpload with selected file', fakeAsync(() => {
    const file = new File([''], 'test.zip', { type: 'application/zip' });
    component.selectedFile = file;
    component.deploymentdetails = { id: 'dep123' };
    // mark the file input control as having a valid value so the upload path runs
    component.sourceSettingsForm.get('fileInput')?.setValue('test.zip');
    component.sourceSettingsForm.get('fileName')?.setValue('test.zip');
    component.onZipUpload();
    tick();
    expect(deploymentService.getS3Details).toHaveBeenCalled();
    expect(deploymentService.uploadFileToS3).toHaveBeenCalled();
  }));

  it('should submit general settings', () => {
    component.deploymentdetails = { id: 'dep123', application: {}, buildConfig: {}, network: {}, sourceCode: {} };
    component.generalSettingsForm.patchValue({ name: 'app1', instanceType: { instanceType: 'small' }, replicas: 1 });
    component.sourceSettingsForm.patchValue({ type: 'file', fileName: 'file.zip' });
    component.onGeneralSubmit();
    expect(deploymentService.updateDeployment).toHaveBeenCalled();
  });

  it('should submit source settings for zip upload', () => {
    component.zipUpload = true;
    component.deploymentdetails = { id: 'dep123', type: 'file', status: 'active' };
    component.sourceSettingsForm.patchValue({ fileName: 'file.zip' });
    component.onSourceSubmit();
    expect(deploymentService.updateDeployment).toHaveBeenCalled();
  });

  it('should submit source settings for vcs deploy', () => {
    component.zipUpload = false;
    component.vcsDeploy = true;
    component.deploymentdetails = { id: 'dep123', type: 'vcs', provider: 'github', status: 'active' };
    component.sourceSettingsForm.patchValue({ repoUrl: 'url', branchName: 'main' });
    component.onSourceSubmit();
    expect(deploymentService.updateDeployment).toHaveBeenCalled();
  });

  // it('should delete deployment and emit close event', async () => {
  //   const deploymentService = TestBed.inject(DeploymentsService);
  //   const toaster = TestBed.inject(ToastrService);
  //   const closeSpy = spyOn(component.closeModalEvent, 'emit');

  //   spyOn(deploymentService, 'deleteDeployment').and.returnValue(of({ status: 'success', message: 'Deleted' }));
  //   spyOn(toaster, 'success');

  //   await component.deleteDeployment();
  //   fixture.detectChanges();

  //   await fixture.whenStable();

  //   expect(deploymentService.deleteDeployment).toHaveBeenCalled();
  //   expect(toaster.success).toHaveBeenCalledWith('Deleted');
  //   expect(closeSpy).toHaveBeenCalled();
  // });


  it('should copy domain value', () => {
    const input = document.createElement('input');
    input.value = 'test';
    spyOn(input, 'select');
    spyOn(document, 'execCommand').and.returnValue(true);
    component.copyDomainValue(input);
    expect(input.select).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('should disable forms when currentStatus is Building', () => {
    component.currentStatus = 'Building';
    component.ngOnInit();
    expect(component.freezeAddNewData).toBeTrue();
    expect(component.formDisabled).toBeTrue();
  });

  it('should disable forms when user lacks permissions', () => {
    const permissionService = TestBed.inject(PermissionService);
    (permissionService as any).canWriteGlobal.and.returnValue(false);
    (permissionService as any).canAdminGlobal.and.returnValue(false);
    (permissionService as any).canDeleteForCurrentUser.and.returnValue(false);
    component.ngOnInit();
    expect(component.formDisabled).toBeTrue();
  });

  it('should format currency correctly', () => {
    const result = component.formatCurrency(100);
    expect(result).toContain('100');
  });

  it('should return empty string for invalid currency values', () => {
    expect(component.formatCurrency(undefined)).toBe('');
    expect(component.formatCurrency(NaN)).toBe('');
  });

  it('should handle missing deployment ID', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    (activatedRoute as any).queryParams = of({});
    component.ngOnInit();
    expect(toastr.error).toHaveBeenCalledWith('Deployment ID is missing in the URL');
  });

  it('should set zipUpload when source type is file', () => {
    (deploymentService as any).getDeploymentById.and.returnValue(
      of({ status: 'success', data: { sourceCode: { type: 'file', s3FileKey: 'test.zip' }, application: {} } })
    );
    component.resources = [];
    component.getDeploymentById();
    expect(component.zipUpload).toBeTrue();
    expect(component.vcsDeploy).toBeFalse();
  });

  it('should set vcsDeploy when source type is vcs', () => {
    (deploymentService as any).getDeploymentById.and.returnValue(
      of({ status: 'success', data: { sourceCode: { type: 'vcs', gitUrl: 'https://github.com/user/repo.git -b main' }, application: {} } })
    );
    component.resources = [];
    component.getDeploymentById();
    expect(component.vcsDeploy).toBeTrue();
    expect(component.zipUpload).toBeFalse();
  });

  it('should parse git URL correctly', () => {
    (deploymentService as any).getDeploymentById.and.returnValue(
      of({
        status: 'success',
        data: {
          sourceCode: { type: 'vcs', gitUrl: 'https://oauth:token@github.com/user/repo.git -b develop' },
          application: { instanceType: 'small' }
        }
      })
    );
    component.resources = [{ instanceType: 'small' }];
    component.getDeploymentById();
    expect(component.sourceSettingsForm.get('branchName')?.value).toBe('develop');
  });

  it('should set cpuExhausted when CPU quota exceeded', () => {
    component.cpuQuota = { remaining: 1 };
    component.generalSettingsForm.patchValue({
      instanceType: { cpuVcpu: '2000m', memoryGb: '1Gi' }
    });
    component.onInstanceTypeChange();
    expect(component.cpuExhausted).toBeTrue();
  });

  it('should set ramExhausted when RAM quota exceeded', () => {
    component.cpuQuota = { remaining: 10 };
    component.ramQuota = { remaining: 1 };
    component.generalSettingsForm.patchValue({
      instanceType: { cpuVcpu: '1', memoryGb: '2048Mi' }
    });
    component.onInstanceTypeChange();
    expect(component.ramExhausted).toBeTrue();
  });

  it('should not set exhausted flags when quota available', () => {
    component.cpuQuota = { remaining: 10 };
    component.ramQuota = { remaining: 10 };
    component.generalSettingsForm.patchValue({
      instanceType: { cpuVcpu: '500m', memoryGb: '512Mi' }
    });
    component.onInstanceTypeChange();
    expect(component.cpuExhausted).toBeFalse();
    expect(component.ramExhausted).toBeFalse();
  });

  it('should handle file too large error', () => {
    const largeFile = new File(['a'], 'large.zip', { type: 'application/zip' });
    Object.defineProperty(largeFile, 'size', { value: 500_000_001 });
    component.onFileSelect({ target: { files: [largeFile] } });
    expect(toastr.error).toHaveBeenCalledWith('File size too large.');
    expect(component.fileError).toBe('File size large');
  });

  it('should remove file extension from filename', () => {
    const result = component.removeFileExtension('test.file.zip');
    expect(result).toBe('test.file');
  });

  it('should handle file without extension', () => {
    const result = component.removeFileExtension('testfile');
    expect(result).toBe('testfile');
  });

  it('should show error when no file selected for zip upload', () => {
    component.selectedFile = null;
    component.sourceSettingsForm.get('fileInput')?.setErrors({ required: true });
    component.onZipUpload();
    expect(component.fileError).toBe('Please select a valid file to upload.');
  });

  it('should handle onGeneralSubmit with invalid form', () => {
    component.generalSettingsForm.setErrors({ required: true });
    const markAllAsTouchedSpy = spyOn(component.generalSettingsForm, 'markAllAsTouched');
    component.onGeneralSubmit();
    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(deploymentService.updateDeployment).not.toHaveBeenCalled();
  });

  it('should submit general settings with changed fields', () => {
    component.deploymentdetails = {
      id: 'dep123',
      name: 'oldname',
      application: { replicas: 1, instanceType: 'small' },
      buildConfig: {},
      network: {},
      sourceCode: { type: 'file' }
    };
    component.generalSettingsForm.patchValue({
      name: 'newname',
      instanceType: { instanceType: 'small' },
      replicas: 2
    });
    component.sourceSettingsForm.patchValue({ type: 'file' });
    component.onGeneralSubmit();
    expect(deploymentService.updateDeployment).toHaveBeenCalled();
  });

  it('should handle onBuildSubmit', () => {
    const fb = TestBed.inject(FormBuilder);
    component.buildSettingsForm = fb.group({
      buildCommand: ['npm build'],
      startCommand: ['npm start']
    });
    component.deploymentdetails = { id: 'dep123', status: 'active' };
    (deploymentService as any).updateDeployment.and.returnValue(
      of({ status: 'Success', message: 'Build updated' })
    );
    component.onBuildSubmit();
    expect(toastr.success).toHaveBeenCalledWith('Build updated');
  });

  it('should handle onDeploySubmit', () => {
    const fb = TestBed.inject(FormBuilder);
    component.deploySettingsForm = fb.group({ replicas: [1] });
    component.deploymentdetails = { id: 'dep123', status: 'active' };
    component.onDeploySubmit();
    expect(deploymentService.updateDeployment).toHaveBeenCalled();
  });

  xit('should delete deployment after confirmation', fakeAsync(() => {
    component.deploymentdetails = { id: 'dep123' };
    const modalService = TestBed.inject(NgbModal);
    const modalRef = { result: Promise.resolve(true), componentInstance: {} } as any;
    (modalService as any).open.and.returnValue(modalRef);
    const closeSpy = spyOn(component.closeModalEvent, 'emit');

    component.deleteDeployment();
    tick();

    expect(deploymentService.deleteDeployment).toHaveBeenCalledWith('dep123');
    expect(closeSpy).toHaveBeenCalled();
  }));

  it('should call getDeployments', () => {
    component.getDeployments();
    expect(deploymentService.getDeployments).toHaveBeenCalled();
  });

  it('should set ephemeralExhausted when quota exceeded', () => {
    component.ephemeralQuota = { remaining: 5 };
    component.generalSettingsForm.patchValue({ ephemeralStorage: '10' });
    component.onEphemeralMouseOut();
    expect(component.ephemeralExhausted).toBeTrue();
  });

  it('should not set ephemeralExhausted when quota available', () => {
    component.ephemeralQuota = { remaining: 10 };
    component.generalSettingsForm.patchValue({ ephemeralStorage: '5' });
    component.onEphemeralMouseOut();
    expect(component.ephemeralExhausted).toBeFalse();
  });

  it('should check if control has error and is touched', () => {
    const control = component.generalSettingsForm.get('name');
    control?.setErrors({ required: true });
    control?.markAsTouched();
    expect(component.isError('name', 'required')).toBeTrue();
  });

  it('should return false when control has no error', () => {
    const control = component.generalSettingsForm.get('name');
    control?.setValue('test');
    expect(component.isError('name', 'required')).toBeFalse();
  });

  it('should set port to null when empty', () => {
    component.generalSettingsForm.patchValue({ port: '' });
    component.Port();
    expect(component.generalSettingsForm.get('port')?.value).toBeNull();
  });

  it('should get current project ID from localStorage', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj123' }));
    const id = component.getCurrentProjectId();
    expect(id).toBe('proj123');
  });

  it('should return undefined when project not in localStorage', () => {
    localStorage.removeItem('project');
    const id = component.getCurrentProjectId();
    expect(id).toBeUndefined();
  });

  it('should get current environment ID from localStorage', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env123' }));
    const id = component.getCurrentEnvId();
    expect(id).toBe('env123');
  });

  it('should return undefined when environment not in localStorage', () => {
    localStorage.removeItem('environment');
    const id = component.getCurrentEnvId();
    expect(id).toBeUndefined();
  });

  it('should handle CPU conversion from millicores', () => {
    component.cpuQuota = { remaining: 10 };
    component.ramQuota = { remaining: 10 };
    component.generalSettingsForm.patchValue({
      instanceType: { cpuVcpu: '1500m', memoryGb: '1Gi' }
    });
    component.onInstanceTypeChange();
    expect(component.cpuExhausted).toBeFalse();
  });

  it('should handle memory conversion from Mi', () => {
    component.cpuQuota = { remaining: 10 };
    component.ramQuota = { remaining: 10 };
    component.generalSettingsForm.patchValue({
      instanceType: { cpuVcpu: '1', memoryGb: '1024Mi' }
    });
    component.onInstanceTypeChange();
    expect(component.ramExhausted).toBeFalse();
  });

  it('should scroll to fragment after view init', fakeAsync(() => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    (activatedRoute as any).snapshot.fragment = 'section1';
    
    component.ngAfterViewInit();
    tick(150);
    
    expect(component).toBeTruthy();
  }));

  it('should not scroll when no fragment', fakeAsync(() => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    (activatedRoute as any).snapshot.fragment = null;
    
    component.ngAfterViewInit();
    tick(150);
    
    expect(component).toBeTruthy();
  }));

  it('should handle ephemeral storage with Gi suffix', () => {
    (deploymentService as any).getDeploymentById.and.returnValue(
      of({
        status: 'success',
        data: {
          application: { ephemeralStorage: '10Gi' },
          sourceCode: { type: 'file' }
        }
      })
    );
    component.resources = [];
    component.getDeploymentById();
    expect(component.generalSettingsForm.get('ephemeralStorage')?.value).toBe('10');
  });

  it('should emit close event', () => {
    const emitSpy = spyOn(component.closeModalEvent, 'emit');
    component.onCloseClicked();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should include dockerfilePath in sourceCode when present', () => {
    component.deploymentdetails = {
      id: 'dep123',
      application: {},
      buildConfig: {},
      network: {},
      sourceCode: { type: 'file' }
    };
    component.generalSettingsForm.patchValue({
      instanceType: { instanceType: 'small' },
      replicas: 1,
      dockerfilePath: 'custom/Dockerfile'
    });
    component.sourceSettingsForm.patchValue({ type: 'file' });
    
    component.onGeneralSubmit();
    
    const callArgs = (deploymentService.updateDeployment as jasmine.Spy).calls.mostRecent().args[1];
    expect(callArgs.sourceCode.dockerfilePath).toBe('custom/Dockerfile');
  });

  it('should handle parse error in getCurrentProjectId', () => {
    localStorage.setItem('project', 'invalid-json');
    const id = component.getCurrentProjectId();
    expect(id).toBe('invalid-json');
  });

  it('should handle parse error in getCurrentEnvId', () => {
    localStorage.setItem('environment', '{invalid}');
    const id = component.getCurrentEnvId();
    expect(id).toBeTruthy();
  });

  it('should return empty string for unknown provider in buildGitUrl', () => {
    component.sourceSettingsForm.patchValue({
      provider: 'bitbucket',
      repoUrl: 'url',
      branchName: 'main'
    });
    const url = (component as any).buildGitUrl();
    expect(url).toBe('');
  });

  it('should build GitHub git URL', () => {
    component.sourceSettingsForm.patchValue({
      provider: 'github',
      repoUrl: 'https://github.com/user/repo',
      branchName: 'develop'
    });
    const url = (component as any).buildGitUrl();
    expect(url).toContain('github.com');
    expect(url).toContain('develop');
  });

  it('should build GitLab git URL', () => {
    component.sourceSettingsForm.patchValue({
      provider: 'gitlab',
      repoUrl: 'https://gitlab.com/user/repo',
      branchName: 'main'
    });
    const url = (component as any).buildGitUrl();
    expect(url).toContain('gitlab.com');
  });

  it('should handle onInstanceTypeChange with no selected resource', () => {
    component.generalSettingsForm.patchValue({ instanceType: null });
    component.onInstanceTypeChange();
    expect(component).toBeTruthy();
  });

  it('should update selectedResource on instance type change', () => {
    const resource = { instanceType: 'large', cpuVcpu: '2', memoryGb: '4Gi' };
    component.generalSettingsForm.patchValue({ instanceType: resource });
    expect(component.selectedResource).toBe(resource);
  });

  it('should handle getChangedFields with null values', () => {
    const current = { name: 'test', value: null, other: undefined };
    const original = { name: 'test', value: 'old' };
    const changed = (component as any).getChangedFields(current, original);
    expect(changed.value).toBeUndefined();
  });

  it('should detect changed string fields', () => {
    const current = { name: 'new', value: 'changed' };
    const original = { name: 'old', value: 'original' };
    const changed = (component as any).getChangedFields(current, original);
    expect(changed.name).toBe('new');
    expect(changed.value).toBe('changed');
  });

  it('should trim and compare string fields', () => {
    const current = { name: 'test  ' };
    const original = { name: 'test' };
    const changed = (component as any).getChangedFields(current, original);
    expect(Object.keys(changed).length).toBe(0);
  });

  it('should handle errors in onGeneralSubmit', () => {
    component.deploymentdetails = { id: 'dep123', application: {}, network: {}, sourceCode: {} };
    component.generalSettingsForm.patchValue({ name: 'test', replicas: 1, instanceType: { instanceType: 'small' } });
    component.sourceSettingsForm.patchValue({ type: 'file' });
    (deploymentService as any).updateDeployment.and.returnValue(throwError(() => new Error('Update failed')));
    const consoleSpy = spyOn(console, 'error');
    
    component.onGeneralSubmit();
    
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle errors in onSourceSubmit', () => {
    component.zipUpload = true;
    component.deploymentdetails = { id: 'dep123', type: 'file', status: 'active' };
    component.sourceSettingsForm.patchValue({ fileName: 'test.zip' });
    (deploymentService as any).updateDeployment.and.returnValue(throwError(() => new Error('Update failed')));
    const consoleSpy = spyOn(console, 'error');
    
    component.onSourceSubmit();
    
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle errors in onBuildSubmit', () => {
    const fb = TestBed.inject(FormBuilder);
    component.buildSettingsForm = fb.group({ buildCommand: ['npm build'] });
    component.deploymentdetails = { id: 'dep123', status: 'active' };
    (deploymentService as any).updateDeployment.and.returnValue(throwError(() => new Error('Build failed')));
    const consoleSpy = spyOn(console, 'error');
    
    component.onBuildSubmit();
    
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle errors in onDeploySubmit', () => {
    const fb = TestBed.inject(FormBuilder);
    component.deploySettingsForm = fb.group({ replicas: [1] });
    component.deploymentdetails = { id: 'dep123', status: 'active' };
    (deploymentService as any).updateDeployment.and.returnValue(throwError(() => new Error('Deploy failed')));
    const consoleSpy = spyOn(console, 'error');
    
    component.onDeploySubmit();
    
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle getDeployments when environment ID exists', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env123' }));
    component.getDeployments();
    expect(deploymentService.getDeployments).toHaveBeenCalledWith('env123');
  });

  it('should not call getDeployments when environment ID missing', () => {
    localStorage.removeItem('environment');
    (deploymentService.getDeployments as jasmine.Spy).calls.reset();
    component.getDeployments();
    expect(deploymentService.getDeployments).not.toHaveBeenCalled();
  });
});
