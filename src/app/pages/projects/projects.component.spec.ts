import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastrService,ToastrModule  } from 'ngx-toastr';
import { ProjectsComponent } from './projects.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent,ToastrModule.forRoot(),ReactiveFormsModule, HttpClientModule],
      providers: [ToastrService,FormBuilder] 
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    const form = component.projectForm;
    // Check that the form is truthy
    expect(form).toBeTruthy();

    expect(form.get('projectName')?.value).toBe('');
    expect(form.get('projectDesc')?.value).toBe('');
    expect(form.get('environmentName')?.value).toBe('');
    expect(form.get('region')?.value).toBe('ap-south-1 (Mumbai) - Default');
  });

  it('should check for forbidden name in the projectName field', () => {
    const form = component.projectForm;
    const projectName = form.get('projectName');
  
    // Set a forbidden name
    projectName?.setValue('!$admin123');
    // Trigger validation
    projectName?.markAsTouched();
    // Ensure the forbiddenName error is present
    expect(projectName?.hasError('invalidName')).toBeTruthy();
    // Set a valid name
    projectName?.setValue('project-name');
    // Ensure the name is valid now
    expect(projectName?.valid).toBeTruthy();
  });

  it('should check for forbidden name in the environmentName field', () => {
    const form = component.projectForm;
    const environmentName = form.get('environmentName');
  
    // Set a forbidden name
    environmentName?.setValue('!env123');
    // Trigger validation
    environmentName?.markAsTouched();
    // Ensure the forbiddenName error is present
    expect(environmentName?.hasError('invalidName')).toBeTruthy();
    // Set a valid name
    environmentName?.setValue('env-name');
    // Ensure the name is valid now
    expect(environmentName?.valid).toBeTruthy();
  });

  it('should disable the submit button when the form is invalid', () => {
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;

    // Set form controls to invalid (empty fields)
    component.projectForm.get('projectName')?.setValue('!project123');
    component.projectForm.get('environmentName')?.setValue('!env123');
    fixture.detectChanges();

    // The button should still be disabled because the form is invalid
    expect(submitButton.disabled).toBeTrue();
  });

  it('should enable the submit button when the form is valid', () => {
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;

    // Set form controls to valid values
    component.projectForm.get('projectName')?.setValue('project-name-1');
    component.projectForm.get('environmentName')?.setValue('env-name-1');
    fixture.detectChanges();

    // The button should now be enabled because the form is valid
    expect(submitButton.disabled).toBeFalse();
  });


  it('should disable the submit button when the form is invalid and then enable it when valid', () => {
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;

    // Set the form to invalid state
    component.projectForm.get('projectName')?.setValue('!project123');
    component.projectForm.get('environmentName')?.setValue('!env123');
    fixture.detectChanges();

    // Check if the submit button is disabled
    expect(submitButton.disabled).toBeTrue();

    // Set the form to valid state
    component.projectForm.get('projectName')?.setValue('project-name-1');
    component.projectForm.get('environmentName')?.setValue('env-name-1');
    fixture.detectChanges();

    // Check if the submit button is enabled
    expect(submitButton.disabled).toBeFalse();
  });

});
