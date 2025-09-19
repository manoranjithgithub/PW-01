import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DeploymentReleasesComponent } from './deployment-releases.component';
import { AccordionComponent, AccordionItemComponent, AccordionButtonDirective, TemplateIdDirective } from '@coreui/angular';

describe('DeploymentReleasesComponent', () => {
  let component: DeploymentReleasesComponent;
  let fixture: ComponentFixture<DeploymentReleasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentReleasesComponent,BrowserModule, BrowserAnimationsModule,AccordionComponent, AccordionItemComponent, AccordionButtonDirective, TemplateIdDirective]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeploymentReleasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display both accordion items initially', () => {
    const accordionItems = fixture.debugElement.queryAll(By.css('c-accordion-item'));
    expect(accordionItems.length).toBe(2); 
  });
  
});
