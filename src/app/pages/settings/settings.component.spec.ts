import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { By } from '@angular/platform-browser';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService,ToastrModule } from 'ngx-toastr';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent,HttpClientTestingModule,ToastrModule.forRoot(),ReactiveFormsModule],
      providers: [ToastrService,FormBuilder,{
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
    
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    const form = component.generalProjectForm;
    // Check that the form is truthy
    expect(form).toBeTruthy();

    expect(form.get('projectName')?.value).toBe('');
    expect(form.get('description')?.value).toBe('');
  });

  it('should check for forbidden name in the projectName field', () => {
    const form = component.generalProjectForm;
    const projectName = form.get('projectName');
  
    // Set a forbidden name
    projectName?.setValue('!admin123');
    // Trigger validation
    projectName?.markAsTouched();
    // Ensure the forbiddenName error is present
    expect(projectName?.hasError('invalidName')).toBeTruthy();
    // Set a valid name
    projectName?.setValue('project-name');
    // Ensure the name is valid now
    expect(projectName?.valid).toBeTruthy();
  });

   it('should disable the submit button when the form is invalid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
  
      // Set form controls to invalid (empty fields)
      component.generalProjectForm.get('projectName')?.setValue('!project123');
      fixture.detectChanges();
  
      // The button should still be disabled because the form is invalid
      expect(submitButton.disabled).toBeTrue();
    });
  
    it('should enable the submit button when the form is valid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
  
      // Set form controls to valid values
      component.generalProjectForm.get('projectName')?.setValue('project-one');
      fixture.detectChanges();
  
      // The button should now be enabled because the form is valid
      expect(submitButton.disabled).toBeFalse();
    });
  
  
    it('should disable the submit button when the form is invalid and then enable it when valid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
  
      // Set the form to invalid state
      component.generalProjectForm.get('projectName')?.setValue('!project123');
      fixture.detectChanges();
  
       // Check if the submit button is disabled
       expect(submitButton.disabled).toBeTrue();
  
      // Set the form to valid state
      component.generalProjectForm.get('projectName')?.setValue('project-one');
      fixture.detectChanges();
  
      // Check if the submit button is enabled
      expect(submitButton.disabled).toBeFalse();
    });

    it('should disable the submit button when the form is invalid and then enable it when valid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
  
      // Set the form to invalid state
      component.generalProjectForm.get('projectName')?.setValue('!project123');
      fixture.detectChanges();
  
      // Check if the submit button is disabled
      expect(submitButton.disabled).toBeTrue();
  
      // Set the form to valid state
      component.generalProjectForm.get('projectName')?.setValue('project-name');
      fixture.detectChanges();
  
      // Check if the submit button is enabled
      expect(submitButton.disabled).toBeFalse();
    });

     // Edit environment
     it('should populate the form fields when a environment is selected from the dropdown', () => {
      // Simulate selecting 'sample' from the dropdown
      const selectElement = fixture.debugElement.query(By.css('select'));
      const option1 = component.environments.find((env: { envName: string; }) => env.envName === "sample");
      selectElement.nativeElement.dispatchEvent(new Event('change'));
  
      // Trigger change detection after selecting
      fixture.detectChanges();
  
      const nameInput = fixture.debugElement.query(By.css('#envName')).nativeElement;
      
      expect(nameInput.value).toBe('sample');
     
    });


    it('should disable the submit button when the environment form is invalid and then enable it when valid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
     
      // Set the form to valid state
      component.environmentForm.get('envName')?.setValue('env-one');
      fixture.detectChanges();
  
      // Check if the submit button is enabled
      expect(submitButton.disabled).toBeFalse();
    });
  
});
