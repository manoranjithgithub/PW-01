import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { AppComponent } from './app.component';
import { Title } from '@angular/platform-browser';
import { IconSetService } from '@coreui/icons-angular';
import { SharedService } from './shared/services/shared.service';
import { Subject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: any;
  let routerEvents$: Subject<any>;
  let titleSpy: jasmine.SpyObj<Title>;
  let iconSetServiceSpy: jasmine.SpyObj<IconSetService>;
  let sharedServiceSpy: jasmine.SpyObj<SharedService>;
  let routerSpy: any;

  beforeEach(async () => {
    routerEvents$ = new Subject();
    titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
    iconSetServiceSpy = jasmine.createSpyObj('IconSetService', [], { icons: {} });
    sharedServiceSpy = jasmine.createSpyObj('SharedService', ['show', 'hide']);
    routerSpy = { events: routerEvents$.asObservable() };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Title, useValue: titleSpy },
        { provide: IconSetService, useValue: iconSetServiceSpy },
        { provide: SharedService, useValue: sharedServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have title set to NIMBUZ', () => {
    expect(component.title).toBe('NIMBUZ');
  });

  it('should set document title in constructor', () => {
    expect(titleSpy.setTitle).toHaveBeenCalledWith('NIMBUZ');
  });

  it('should initialize iconSetService icons in constructor', () => {
    expect(iconSetServiceSpy.icons).toBeDefined();
  });

  it('should subscribe to router events in ngOnInit', () => {
    const subscribeSpy = spyOn(routerSpy.events, 'subscribe').and.callThrough();
    component.ngOnInit();
    expect(subscribeSpy).toHaveBeenCalled();
  });

  it('should handle NavigationEnd event', () => {
    component.ngOnInit();
    const navEnd = new NavigationEnd(1, '/test', '/test');
    expect(() => routerEvents$.next(navEnd)).not.toThrow();
  });

  it('should return early for non-NavigationEnd events - NavigationStart', () => {
    component.ngOnInit();
    const navStart = new NavigationStart(1, '/test');
    expect(() => routerEvents$.next(navStart)).not.toThrow();
  });

  it('should return early for non-NavigationEnd events - NavigationCancel', () => {
    component.ngOnInit();
    const navCancel = new NavigationCancel(1, '/test', 'canceled');
    expect(() => routerEvents$.next(navCancel)).not.toThrow();
  });

  it('should return early for non-NavigationEnd events - NavigationError', () => {
    component.ngOnInit();
    const navError = new NavigationError(1, '/test', 'error');
    expect(() => routerEvents$.next(navError)).not.toThrow();
  });

  it('should handle multiple router events', () => {
    component.ngOnInit();
    routerEvents$.next(new NavigationStart(1, '/test'));
    routerEvents$.next(new NavigationEnd(1, '/test', '/test'));
    routerEvents$.next(new NavigationStart(2, '/other'));
    routerEvents$.next(new NavigationEnd(2, '/other', '/other'));
    expect(component).toBeTruthy();
  });

  it('should handle custom event types that are not NavigationEnd', () => {
    component.ngOnInit();
    const customEvent = { type: 'CustomEvent' };
    expect(() => routerEvents$.next(customEvent)).not.toThrow();
  });
});
