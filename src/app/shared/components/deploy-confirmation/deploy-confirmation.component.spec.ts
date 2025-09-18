import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployConfirmationComponent } from './deploy-confirmation.component';

describe('DeployConfirmationComponent', () => {
  let component: DeployConfirmationComponent;
  let fixture: ComponentFixture<DeployConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeployConfirmationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeployConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
