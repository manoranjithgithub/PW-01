import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservabilityLoggingComponent } from './observability-logging.component';

describe('ObservabilityLoggingComponent', () => {
  let component: ObservabilityLoggingComponent;
  let fixture: ComponentFixture<ObservabilityLoggingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservabilityLoggingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ObservabilityLoggingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
