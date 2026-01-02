import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { LoaderComponent } from './loader.component';
import { SharedService } from '../../services/shared.service';

describe('LoaderComponent', () => {
  let component: LoaderComponent;
  let fixture: ComponentFixture<LoaderComponent>;
  let isLoadingSubject: BehaviorSubject<boolean>;
  let mockSharedService: any;

  beforeEach(async () => {
    isLoadingSubject = new BehaviorSubject<boolean>(false);
    mockSharedService = {
      isLoading$: isLoadingSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [LoaderComponent],
      providers: [
        { provide: SharedService, useValue: mockSharedService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use SharedService.isLoading$ as isLoading$', () => {
    expect((component as any).isLoading$).toBeDefined();
  });

  it('should show loader when isLoading$ emits true', () => {
    isLoadingSubject.next(true);
    fixture.detectChanges();
    const el: HTMLElement | null = fixture.nativeElement.querySelector('.loader-backdrop');
    expect(el).not.toBeNull();
  });

  it('should hide loader when isLoading$ emits false', () => {
    isLoadingSubject.next(false);
    fixture.detectChanges();
    const el: HTMLElement | null = fixture.nativeElement.querySelector('.loader-backdrop');
    expect(el).toBeNull();
  });
});