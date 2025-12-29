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
});
