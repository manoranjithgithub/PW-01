import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DeploymentConfigMapsComponent } from './deployment-config-maps.component';
import { CardBodyComponent, CardComponent, CardGroupComponent, AccordionComponent, AccordionItemComponent, AccordionButtonDirective, TemplateIdDirective } from '@coreui/angular';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DeploymentsService } from '../deployment.service';
import { PermissionService } from '../../../shared/services/permission.service';

describe('DeploymentConfigMapsComponent', () => {
  let component: DeploymentConfigMapsComponent;
  let fixture: ComponentFixture<DeploymentConfigMapsComponent>;

  beforeEach(async () => {
    const queryParams$ = new Subject<any>();
    const deploymentsSpy = jasmine.createSpyObj('DeploymentsService', ['getDeploymentById', 'updateDeployment']);
    deploymentsSpy.getDeploymentById.and.returnValue(of({ data: { config: { path: '', name: '' } } }));
    deploymentsSpy.updateDeployment.and.returnValue(of({ status: 'success' }));

    const permissionSpy = jasmine.createSpyObj('PermissionService', ['canWriteGlobal', 'canAdminGlobal', 'canDeleteForCurrentUser']);
    permissionSpy.canWriteGlobal.and.returnValue(true);
    permissionSpy.canAdminGlobal.and.returnValue(false);
    permissionSpy.canDeleteForCurrentUser.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [DeploymentConfigMapsComponent,BrowserModule, BrowserAnimationsModule,
        CardBodyComponent,
        CardComponent,
        CardGroupComponent,
        AccordionComponent,
        AccordionItemComponent,
        AccordionButtonDirective,
        TemplateIdDirective, FormsModule,
        HttpClientTestingModule
      ],
      providers: [{
        provide: ActivatedRoute, useValue: {
            snapshot: { paramMap: { get: () => 'deployment123' } },
            queryParams: queryParams$
          }
      },
      { provide: ToastrService, useValue: { error: jasmine.createSpy('error'), success: jasmine.createSpy('success') } },
      { provide: DeploymentsService, useValue: deploymentsSpy },
      { provide: PermissionService, useValue: permissionSpy }
    ],
    })
    TestBed.overrideProvider(DeploymentsService, { useValue: deploymentsSpy });
    await TestBed.compileComponents();
    
    fixture = TestBed.createComponent(DeploymentConfigMapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the "No config maps to display" message in the first card', () => {
    const message = fixture.debugElement.query(By.css('c-card p')).nativeElement;
    expect(message.textContent).toContain('No config maps to display for this deployment.');
  });

  it('should display the file input field with the correct label', () => {
    const label = fixture.debugElement.query(By.css('label[for="fileInput"]')).nativeElement;
    expect(label.textContent).toContain('Select a file to upload');

    const fileInput = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement;
    expect(fileInput).toBeTruthy();
  });

  it('should display the correct content inside the accordion body', () => {
    const accordionBody = fixture.debugElement.query(By.css('div.accordion-body')).nativeElement;
    expect(accordionBody.textContent).toContain('File Path');
  });

  it('ngOnInit should disable form when currentStatus is Building', () => {
    component.currentStatus = 'Building';
    component.ngOnInit();
    expect(component.freezeAddNewData).toBeTrue();
    expect(component.fileUploadForm.disabled).toBeTrue();
  });

  it('should call getDeploymentById when queryParams contains id and populate form', () => {
    const deployments = TestBed.inject(DeploymentsService) as any;
    const route = TestBed.inject(ActivatedRoute) as any;
    if (route.queryParams && (route.queryParams as Subject<any>).next) {
      (route.queryParams as Subject<any>).next({ id: 'dep-1' });
    }
    expect(deployments.getDeploymentById).toHaveBeenCalled();
  });

  it('onFileSelect should set parsedConfigData and add required validator', (done) => {
    const original = (window as any).FileReader;
    (window as any).FileReader = class {
      result: any;
      onload: any;
      readAsDataURL(_file: any) { this.result = 'data:;base64,ZZZ'; if (this.onload) this.onload({}); }
    } as any;

    const input = document.createElement('input');
    const file = new File(['x'], 'cfg.yaml', { type: 'text/yaml' });
    Object.defineProperty(input, 'files', { value: [file] });
    const evt = { target: input } as unknown as Event;

    component.onFileSelect(evt);
    setTimeout(() => {
      expect(component.parsedConfigData).toBe('ZZZ');
      const filePath = component.fileUploadForm.get('filePath');
      expect(filePath?.validator).toBeTruthy();
      (window as any).FileReader = original;
      done();
    }, 0);
  });

  it('fileValidator should return invalidFileType and fileSizeExceeded appropriately', () => {
    const control1: any = { value: 'file.txt' };
    const validator = component.fileValidator(['zip']);
    expect(validator(control1)).toEqual({ invalidFileType: true });

    const control2: any = { value: { split: () => ['file', 'zip'], size: 200_000_001 } };
    const validator2 = component.fileValidator(['zip']);
    expect(validator2(control2)).toEqual({ fileSizeExceeded: true });
  });

  it('updateConfigFile should call updateDeployment and show toast on success', () => {
    const deployments = TestBed.inject(DeploymentsService) as any;
    const toaster = TestBed.inject(ToastrService) as any;
    spyOn(component, 'clearFile');
    component.deploymentdetails = { id: 'd1' } as any;
    component.fileUploadForm.get('filePath')?.setValue('/path');
    component.fileUploadForm.get('fileName')?.setValue('cfg');
    component.parsedConfigData = 'DATA';

    deployments.updateDeployment.and.returnValue(of({ status: 'success' }));

    component.updateConfigFile();

    expect(deployments.updateDeployment).toHaveBeenCalledWith('d1', jasmine.any(Object));
    expect(toaster.success).toHaveBeenCalledWith('Config Map updated successfully');
    expect((component as any).clearFile).toHaveBeenCalled();
  });

  it('clearFile should reset form and clear DOM input', () => {
    const input = document.createElement('input');
    input.id = 'fileInput';
    input.value = '';
    document.body.appendChild(input);

    component.fileUploadForm.get('fileInput')?.setValue(null);
    component.fileUploadForm.get('fileName')?.setValue('y');
    component.fileName = 'y';

    component.clearFile();

    expect(component.fileUploadForm.get('fileInput')?.value).toBeNull();
    expect(component.fileUploadForm.get('fileName')?.value).toBeNull();
    expect(component.fileName).toBeNull();
    expect((document.getElementById('fileInput') as HTMLInputElement).value).toBe('');
    document.body.removeChild(input);
  });

  it('should display the upload button inside the accordion body', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const uploadButtonDebug = buttons.find(b => (b.nativeElement.textContent || '').trim().includes('Upload'));
    expect(uploadButtonDebug).toBeTruthy();
    expect((uploadButtonDebug as any).nativeElement.textContent).toContain('Upload');
  });
});
