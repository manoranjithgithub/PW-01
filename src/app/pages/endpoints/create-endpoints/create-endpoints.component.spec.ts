import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEndpointsComponent } from './create-endpoints.component';

describe('CreateEndpointsComponent', () => {
  let component: CreateEndpointsComponent;
  let fixture: ComponentFixture<CreateEndpointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEndpointsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
