import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewScreenComponent } from './review-screen.component';
import { DeploymentsService } from '../deployment.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { PermissionService } from '../../../shared/services/permission.service';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockDeploymentsService {
  createDeployement = jasmine.createSpy('createDeployement').and.returnValue(
    of({ status: 'success', message: 'Created successfully' })
  );
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockLocation {
  back = jasmine.createSpy('back');
}

class MockSharedService {}

class MockToastrService {
  success = jasmine.createSpy('success');
  error = jasmine.createSpy('error');
}

class MockPermissionService {
  canWriteGlobal = jasmine.createSpy('canWriteGlobal').and.returnValue(true);
}

describe('ReviewScreenComponent', () => {
  let component: ReviewScreenComponent;
  let fixture: ComponentFixture<ReviewScreenComponent>;
  let deploymentService: MockDeploymentsService;
  let router: MockRouter;
  let toaster: MockToastrService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewScreenComponent,HttpClientTestingModule],
      providers: [
        { provide: DeploymentsService, useClass: MockDeploymentsService },
        { provide: Router, useClass: MockRouter },
        { provide: Location, useClass: MockLocation },
        { provide: SharedService, useClass: MockSharedService },
        { provide: ToastrService, useClass: MockToastrService },
        { provide: PermissionService, useClass: MockPermissionService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(ReviewScreenComponent, {
      set: {
        providers: [
          { provide: DeploymentsService, useClass: MockDeploymentsService }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ReviewScreenComponent);
    component = fixture.componentInstance;
    deploymentService = (component as any).deploymentsService as any;
    router = TestBed.inject(Router) as any;
    toaster = TestBed.inject(ToastrService) as any;

    component.review = {
      repoUrl: 'https://repo.git',
      stepOne: {
        selectedBranch: 'main',
        buildCommand: 'npm run build',
        startCommand: 'npm start',
        installCommand: 'npm install',
        healthEndpoint: '/health',
        replicas: 2,
        instanceType: 'small',
        storage: 10,
        ephemeralStorage: null,
        type: 'zip',
        port: 3000,
        zipFilename: 'app.zip'
      }
    };

    component.generalDetails = {
      type: 'zip',
      branchName: 'main',
      name: 'app',
      port: 3000,
      replicas: 1,
      instanceType: { instanceType: 'small' },
      buildCommand: null,
      startCommand: null,
      installCommand: null,
      healthEndpoint: null,
      storage: null,
      ephemeralStorage: null
    };
    component.envData = { data: {} };
    component.secretData = { data: {} };
    component.configFileData = {};
    component.selectedRepoName = 'repo-name';

    spyOn(localStorage, 'getItem').and.returnValue(
      JSON.stringify({ id: 'env123' })
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate back on goBack()', () => {
    const location = TestBed.inject(Location) as any;

    component.goBack();

    expect(location.back).toHaveBeenCalled();
  });
  it('should submit changes and navigate on success', () => {
    component.submitChanges();

    expect(deploymentService.createDeployement).toHaveBeenCalled();
    expect(toaster.success).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/deployment']);
  });

  it('should show error toast on submit failure', () => {
    deploymentService.createDeployement.and.returnValue(
      throwError(() => 'error')
    );

    component.submitChanges();

    expect(toaster.error).toHaveBeenCalled();
  });

  it('should return object keys', () => {
    const result = component.objectKeys({ a: 1, b: 2 });
    expect(result).toEqual(['a', 'b']);
  });

  it('should emit edit event with correct payload', () => {
    spyOn(component.editSelectedStep, 'emit');

    component.edit(2);

    expect(component.editSelectedStep.emit).toHaveBeenCalledWith({
      step: 2,
      fromReview: true
    });
  });

  it('should extract filename from full path', () => {
    const fileName = component.getFileNameOnly('C:\\test\\file.zip');
    expect(fileName).toBe('file.zip');
  });

  it('should return empty string if filename is undefined', () => {
    expect(component.getFileNameOnly(undefined)).toBe('');
  });

  it('should detect object has data', () => {
    expect(component.hasData({ a: 1 })).toBeTrue();
    expect(component.hasData({})).toBeFalse();
    expect(component.hasData(null)).toBeFalse();
  });
});
