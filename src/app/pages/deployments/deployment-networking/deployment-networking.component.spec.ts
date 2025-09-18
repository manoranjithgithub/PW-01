import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentNetworkingComponent } from './deployment-networking.component';

describe('DeploymentNetworkingComponent', () => {
  let component: DeploymentNetworkingComponent;
  let fixture: ComponentFixture<DeploymentNetworkingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentNetworkingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeploymentNetworkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
