import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { UtilizationChartComponent } from './utilization-chart.component';

class MockChart {
  static register(): void { }

  destroy = jasmine.createSpy('destroy');

  constructor(public ctx: any, public config: any) { }
}

(globalThis as any).Chart = MockChart;

describe('UtilizationChartComponent', () => {
  let component: UtilizationChartComponent;
  let fixture: ComponentFixture<UtilizationChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilizationChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UtilizationChartComponent);
    component = fixture.componentInstance;

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;

    spyOn(canvas, 'getContext').and.returnValue({
      createLinearGradient: () => ({
        addColorStop: () => { }
      })
    } as any);

    component.chartCanvas = {
      nativeElement: canvas
    } as any;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set viewInit and render gauge on ngAfterViewInit', () => {
    spyOn(component, 'renderGauge');

    component.ngAfterViewInit();

    expect((component as any).viewInit).toBeTrue();
    expect(component.renderGauge).toHaveBeenCalled();
  });

  // ------------------------------------------------
  // ngOnChanges
  // ------------------------------------------------
  it('should not render gauge if view is not initialized', () => {
    spyOn(component, 'renderGauge');

    component.ngOnChanges({
      value: new SimpleChange(10, 20, false)
    });

    expect(component.renderGauge).not.toHaveBeenCalled();
  });

  it('should render gauge when value changes after view init', () => {
    (component as any).viewInit = true;
    spyOn(component, 'renderGauge');

    component.ngOnChanges({
      value: new SimpleChange(40, 60, false)
    });

    expect(component.renderGauge).toHaveBeenCalled();
  });

  it('should render gauge when rawValue changes after view init', () => {
    (component as any).viewInit = true;
    spyOn(component, 'renderGauge');

    component.ngOnChanges({
      rawValue: new SimpleChange('10', '20', false)
    });

    expect(component.renderGauge).toHaveBeenCalled();
  });

  it('should create chart with green color when value <= 50', () => {
    component.value = 30;
    component.renderGauge();

    const dataset = component.chart.config.data.datasets[0] as any;
    expect(dataset.backgroundColor[0]).toBe('#15BB0D');
  });

  it('should create chart with orange color when value > 50 and <= 80', () => {
    component.value = 70;
    component.renderGauge();

    const dataset = component.chart.config.data.datasets[0] as any;
    expect(dataset.backgroundColor[0]).toBe('#E36E00');
  });

  it('should create chart with red color when value > 80', () => {
    component.value = 90;
    component.renderGauge();

    const dataset = component.chart.config.data.datasets[0] as any;
    expect(dataset.backgroundColor[0]).toBe('#8E2300');
  });

  it('should cap value at 100', () => {
    component.value = 150;
    component.renderGauge();

    const dataset = component.chart.config.data.datasets[0] as any;
    expect(dataset.data[0]).toBe(100);
    expect(dataset.data[1]).toBe(0);
  });

  it('should destroy existing chart before creating a new one', () => {
    component.value = 40;
    component.renderGauge();
    const oldChart = component.chart;
    spyOn(oldChart, 'destroy');

    component.value = 60;
    component.renderGauge();

    expect(oldChart.destroy).toHaveBeenCalled();
  });

  it('should return green color for value <= 50', () => {
    expect(component.getValueColor(20)).toBe('#367E00');
  });

  it('should return orange color for value <= 80', () => {
    expect(component.getValueColor(70)).toBe('#E36E00');
  });

  it('should return red color for value > 80', () => {
    expect(component.getValueColor(90)).toBe('#BD2913');
  });

  it('should destroy chart on ngOnDestroy', () => {
    component.value = 50;
    component.renderGauge();
    spyOn(component.chart, 'destroy');
    component.ngOnDestroy();
    expect(component.chart.destroy).toHaveBeenCalled();
  });

});
