import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentMetricsComponent } from './deployment-metrics.component';

describe('DeploymentMetricsComponent', () => {
  let component: DeploymentMetricsComponent;
  let fixture: ComponentFixture<DeploymentMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentMetricsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeploymentMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
