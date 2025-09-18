import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceQuotaComponent } from './service-quota.component';

describe('ServiceQuotaComponent', () => {
  let component: ServiceQuotaComponent;
  let fixture: ComponentFixture<ServiceQuotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceQuotaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ServiceQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
