import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { toastConfigMock, createToastrSpy, activatedRouteMock } from '../../../../test-helpers/testing-mocks';
import { Subject } from 'rxjs';

import { RedirectComponent } from './redirect.component';

describe('RedirectComponent', () => {
  let component: RedirectComponent;
  let fixture: ComponentFixture<RedirectComponent>;
  let queryParamsSubject: Subject<any>;
  let router: Router;
  let toastr: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    queryParamsSubject = new Subject<any>();
    
    await TestBed.configureTestingModule({
      imports: [RedirectComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { 
          provide: ActivatedRoute, 
          useValue: { 
            queryParams: queryParamsSubject.asObservable() 
          } 
        },
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
        { provide: ToastrService, useValue: createToastrSpy() },
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RedirectComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    toastr = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit - access denied', () => {
    it('should handle access_denied error and navigate to deployment', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({ error: 'access_denied' });
      
      setTimeout(() => {
        expect(component.authorizationCode).toBe('');
        expect(router.navigate).toHaveBeenCalledWith(['/deployment']);
        expect(toastr.error).toHaveBeenCalledWith('Access denied');
        done();
      }, 0);
    });

    it('should return early when error is access_denied', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({ error: 'access_denied', code: 'should-not-be-set' });
      
      setTimeout(() => {
        expect(component.authorizationCode).toBe('');
        done();
      }, 0);
    });
  });

  describe('ngOnInit - successful authorization', () => {
    it('should set authorizationCode from query params', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({ code: 'test-auth-code-123' });
      
      setTimeout(() => {
        expect(component.authorizationCode).toBe('test-auth-code-123');
        expect(router.navigate).not.toHaveBeenCalled();
        expect(toastr.error).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should handle code parameter when no error present', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({ code: 'another-code', error: 'something_else' });
      
      setTimeout(() => {
        expect(component.authorizationCode).toBe('another-code');
        done();
      }, 0);
    });

    it('should handle empty code parameter', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({ code: '' });
      
      setTimeout(() => {
        expect(component.authorizationCode).toBe('');
        done();
      }, 0);
    });

    it('should handle undefined code parameter', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({});
      
      setTimeout(() => {
        expect(component.authorizationCode).toBeUndefined();
        done();
      }, 0);
    });
  });

  describe('ngOnInit - edge cases', () => {
    it('should handle params without error or code properties', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({ someOtherProperty: 'value' });
      
      setTimeout(() => {
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should not navigate when error is not access_denied', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({ error: 'other_error', code: 'test-code' });
      
      setTimeout(() => {
        expect(router.navigate).not.toHaveBeenCalled();
        expect(component.authorizationCode).toBe('test-code');
        done();
      }, 0);
    });

    it('should handle multiple query param updates', (done) => {
      fixture.detectChanges();
      
      queryParamsSubject.next({ code: 'first-code' });
      
      setTimeout(() => {
        expect(component.authorizationCode).toBe('first-code');
        
        queryParamsSubject.next({ code: 'second-code' });
        
        setTimeout(() => {
          expect(component.authorizationCode).toBe('second-code');
          done();
        }, 0);
      }, 0);
    });
  });

  describe('constructor', () => {
    it('should initialize with empty authorizationCode', () => {
      expect(component.authorizationCode).toBe('');
    });
  });
});
