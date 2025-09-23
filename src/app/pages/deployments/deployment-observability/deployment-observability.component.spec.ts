import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentObservabilityComponent } from './deployment-observability.component';

describe('DeploymentObservabilityComponent', () => {
  let component: DeploymentObservabilityComponent;
  let fixture: ComponentFixture<DeploymentObservabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentObservabilityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeploymentObservabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
