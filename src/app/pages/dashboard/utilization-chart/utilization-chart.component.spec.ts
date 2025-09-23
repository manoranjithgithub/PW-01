import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtilizationChartComponent } from './utilization-chart.component';

describe('UtilizationChartComponent', () => {
  let component: UtilizationChartComponent;
  let fixture: ComponentFixture<UtilizationChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilizationChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UtilizationChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
