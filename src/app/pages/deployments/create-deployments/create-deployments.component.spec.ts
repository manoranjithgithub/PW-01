import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastrService  } from 'ngx-toastr';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateDeploymentsComponent } from './create-deployments.component';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { SharedService } from 'src/app/shared/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DebugElement } from '@angular/core';

class MockToastrService {
  success(message: string) {}
}

class MockModalService {
  open() {}
  dismiss() {}
}


describe('CreateDeploymentsComponent', () => {
  let component: CreateDeploymentsComponent;
  let fixture: ComponentFixture<CreateDeploymentsComponent>;
  let zipDeploymentModel: ModalComponent;
  let modalDebugElement: DebugElement;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule,CreateDeploymentsComponent,ModalComponent,HttpClientTestingModule,
        MatStepperModule, 
        MatFormFieldModule, 
        MatInputModule, 
        MatButtonModule, 
        MatRadioModule, 
        MatSelectModule,
        BrowserAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: ToastrService, useClass: MockToastrService },
        { provide: NgbModal, useClass: MockModalService },
        { provide: SharedService, useValue: { isValidName: () => Validators.required } },
        {
                provide: ActivatedRoute,
                  useValue: {
                    snapshot: {
                      params: { id: '1' }, // Mocking route parameters
                      queryParams: { search: 'test' }, // Mocking query parameters
                    },
                    params: of({ id: '1' }), // Observable for params
                    queryParams: of({ search: 'test' }), // Observable for queryParams
                  },
                }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateDeploymentsComponent);
    component = fixture.componentInstance;
    
    modalDebugElement = fixture.debugElement.query(By.directive(ModalComponent));
    zipDeploymentModel = modalDebugElement?.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable the upload button when no file is selected', () => {
    const fileInputControl = component.fileUploadForm.get('fileInput');
    fileInputControl?.setValue(null);
    fixture.detectChanges();

    const uploadButton = fixture.debugElement.query(By.css('button'));
    expect(uploadButton.nativeElement.disabled).toBeTrue();
  });

  it('should open the zipDeploymentModel when "zip" is selected from the dropdown', () => {
    spyOn(zipDeploymentModel, 'open');
    const matSelect = fixture.debugElement.query(By.css('mat-select[formControlName="type"]'));
    const mockStepper = {} as MatStepper;
    component.selectedVCS = 'zip';

    matSelect.triggerEventHandler('selectionChange', { value: 'zip' });

    component.connectWithVCS(mockStepper);
    fixture.detectChanges();
    expect(zipDeploymentModel.open).toHaveBeenCalled();
  });

  it('should not open the zipDeploymentModel when a value other than "zip" is selected', () => {
    spyOn(zipDeploymentModel, 'open');
    const matSelect = fixture.debugElement.query(By.css('mat-select[formControlName="type"]'));
    const mockStepper = {} as MatStepper;
    component.selectedVCS = 'git';
    matSelect.triggerEventHandler('selectionChange', { value: 'git' });
    component.connectWithVCS(mockStepper);
    fixture.detectChanges();
    expect(zipDeploymentModel.open).not.toHaveBeenCalled();
  });

  it('should return null for valid file types', () => {
    const validFiles = ['file.zip', 'file.tar', 'file.rar'];

    validFiles.forEach(file => {
      const control = new FormControl(file);
      const result = component.fileValidator(control);
      expect(result).toBeNull(); // No error for valid file types
    });
  });

  it('should return error for invalid file types', () => {
    const invalidFiles = ['file.txt', 'file.exe', 'file.png'];

    invalidFiles.forEach(file => {
      const control = new FormControl(file);
      const result = component.fileValidator(control);
      expect(result).toEqual({ invalidFileType: true }); // Error for invalid file types
    });
  });

  it('should return null for empty file name', () => {
    const control = new FormControl('');
    const result = component.fileValidator(control);
    expect(result).toBeNull(); // No error for empty file name
  });

  it('should return error for file with no extension', () => {
    const control = new FormControl('file');
    const result = component.fileValidator(control);
    expect(result).toEqual({ invalidFileType: true }); // Error if file has no extension
  });

});