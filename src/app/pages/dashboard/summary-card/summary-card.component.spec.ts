import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryCardComponent } from './summary-card.component';

describe('SummaryCardComponent', () => {
  let component: SummaryCardComponent;
  let fixture: ComponentFixture<SummaryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryCardComponent);
    component = fixture.componentInstance;
  });


  it('should create the component', () => {
    expect(component).toBeTruthy();
  });


  it('should accept value, label and description inputs', () => {
    component.value = '₹1,200';
    component.label = 'Total Cost';
    component.description = 'This month';

    fixture.detectChanges();

    expect(component.value).toBe('₹1,200');
    expect(component.label).toBe('Total Cost');
    expect(component.description).toBe('This month');
  });


  it('should use default description if not provided', () => {
    fixture.detectChanges();
    expect(component.description).toBe('from last 7 days');
  });

  it('should render value in template', () => {
    component.value = '500';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('500');
  });

  it('should render label in template', () => {
    component.label = 'Deployments';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Deployments');
  });

  it('should render description in template', () => {
    component.description = 'Last 30 days';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Last 30 days');
  });
});
