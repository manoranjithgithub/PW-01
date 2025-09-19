import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DeploymentConfigMapsComponent } from './deployment-config-maps.component';
import { CardBodyComponent, CardComponent, CardGroupComponent, AccordionComponent, AccordionItemComponent, AccordionButtonDirective, TemplateIdDirective } from '@coreui/angular';
import { FormsModule } from '@angular/forms';

describe('DeploymentConfigMapsComponent', () => {
  let component: DeploymentConfigMapsComponent;
  let fixture: ComponentFixture<DeploymentConfigMapsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentConfigMapsComponent,BrowserModule, BrowserAnimationsModule,
        CardBodyComponent,
        CardComponent,
        CardGroupComponent,
        AccordionComponent,
        AccordionItemComponent,
        AccordionButtonDirective,
        TemplateIdDirective, FormsModule
      ]
    })
    .compileComponents();
    
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
    expect(accordionBody.textContent).toContain('Manage your build and deployment settings through a config file.');
  });

  it('should display the upload button inside the accordion body', () => {
    const uploadButton = fixture.debugElement.query(By.css('button.btn.btn-primary')).nativeElement;
    expect(uploadButton).toBeTruthy();
    expect(uploadButton.textContent).toContain('Upload');
  });
});
