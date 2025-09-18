import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentLogsComponent } from './deployment-logs.component';

describe('DeploymentLogsComponent', () => {
  let component: DeploymentLogsComponent;
  let fixture: ComponentFixture<DeploymentLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentLogsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeploymentLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
