import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DeploymentSettingsComponent } from './deployment-settings.component';
import { ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CalloutComponent,AccordionComponent, AccordionItemComponent, AccordionButtonDirective, TemplateIdDirective } from '@coreui/angular';

describe('DeploymentSettingsComponent', () => {
  let component: DeploymentSettingsComponent;
  let fixture: ComponentFixture<DeploymentSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentSettingsComponent,BrowserModule, BrowserAnimationsModule,AccordionComponent, AccordionItemComponent, AccordionButtonDirective, TemplateIdDirective, CalloutComponent,
        ReactiveFormsModule, CommonModule 
      ],
      providers: [ FormBuilder ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeploymentSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form controls correctly', () => {
    expect(component.generalSettingsForm.get('deploymentId')?.value).toBe('093bb1a7-4cdd-4f3a-a582-efa296793c7d');
    expect(component.sourceSettingsForm.get('type')?.value).toBe('vcs');
    expect(component.networkSettingsForm.get('serviceDomainPort')?.value).toBe('');
    expect(component.buildSettingsForm.get('buildCommand')?.value).toBe('');
    expect(component.deploySettingsForm.get('startCommand')?.value).toBe('');
  });

  it('should update flags and provider on type change (gitLab)', () => {
    component.sourceSettingsForm.get('type')?.setValue('gitLab');
    expect(component.zipUpload).toBeFalse();
    expect(component.vcsDeploy).toBeTrue();
    expect(component.sourceSettingsForm.get('provider')?.value).toBe('gitLab');
  });

     it('should return null for valid file types', () => {
        const validFiles = ['file.zip', 'file.rar'];
    
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
