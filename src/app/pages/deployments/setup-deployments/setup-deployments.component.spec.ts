import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupDeploymentsComponent } from './setup-deployments.component';

describe('SetupDeploymentsComponent', () => {
  let component: SetupDeploymentsComponent;
  let fixture: ComponentFixture<SetupDeploymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupDeploymentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SetupDeploymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
