import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ButtonModule, CardModule, FormModule, GridModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '../../core/icons/icon-subset';
import { RegisterComponent } from './register.component';
import { UserService } from '../../core/services/user.service';
import { ToastrService, TOAST_CONFIG } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { toastConfigMock } from '../../../test-helpers/testing-mocks';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  const mockUserService = {
    register: jasmine.createSpy('register'),
    forgotPassword: jasmine.createSpy('forgotPassword')
  } as any as Partial<UserService>;

  const mockToastr = {
    error: jasmine.createSpy('error'),
    success: jasmine.createSpy('success')
  } as any as Partial<ToastrService>;

  const mockRouter = {
    url: '/register'
  } as any as Partial<Router>;

  const mockActivatedRoute = {
    queryParams: of({})
  } as any as Partial<ActivatedRoute>;

  let iconSetService: IconSetService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardModule, FormModule, GridModule, ButtonModule, IconModule, RegisterComponent],
      providers: [
        IconSetService,
        { provide: UserService, useValue: mockUserService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    iconSetService = TestBed.inject(IconSetService);
    iconSetService.icons = { ...iconSubset };

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    (mockUserService.register as jasmine.Spy).calls.reset();
    (mockUserService.forgotPassword as jasmine.Spy).calls.reset();
    (mockToastr.error as jasmine.Spy).calls.reset();
    (mockToastr.success as jasmine.Spy).calls.reset();
    localStorage.clear();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should default orgName to nimbuz for individual type and require terms when not password reset', fakeAsync(() => {
    (mockActivatedRoute as any).queryParams = of({ type: 'individual' });
    (mockRouter as any).url = '/register';
    fixture.detectChanges();
    tick();
    expect(component.registrationForm.get('type')?.value).toBe('individual');
    expect(component.registrationForm.get('orgName')?.value).toBe('nimbuz');
    component.registrationForm.get('username')?.setValue('user1');
    component.registrationForm.get('password')?.setValue('Abc@1234');
    component.registrationForm.get('email')?.setValue('a@b.com');
    component.registrationForm.get('orgName')?.setValue('nimbuz');
    component.registrationForm.get('terms')?.setValue(false);
    expect(component.registrationForm.invalid).toBeTrue();
  }));

  it('should not call register when form invalid on submit', () => {
    fixture.detectChanges();
    component.registrationForm.get('username')?.setValue('');
    component.registrationForm.get('password')?.setValue('');
    component.onSubmit();
    expect(mockUserService.register).not.toHaveBeenCalled();
  });

  it('should call register and set success message on success', fakeAsync(() => {
    (mockRouter as any).url = '/register';
    fixture.detectChanges();
    component.registrationForm.get('username')?.setValue('user1');
    component.registrationForm.get('password')?.setValue('Abc@1234');
    component.registrationForm.get('email')?.setValue('a@b.com');
    component.registrationForm.get('orgName')?.setValue('nimbuz');
    component.registrationForm.get('terms')?.setValue(true);

    (mockUserService.register as jasmine.Spy).and.returnValue(of({}));

    component.onSubmit();
    tick();

    expect(component.isRegistrationSuccess).toBeTrue();
    expect(component.successMessage).toContain('Registration Successful');
    expect(component.loading).toBeFalse();
  }));

  it('should handle register error and show toaster message', fakeAsync(() => {
    fixture.detectChanges();
    component.registrationForm.get('username')?.setValue('user1');
    component.registrationForm.get('password')?.setValue('Abc@1234');
    component.registrationForm.get('email')?.setValue('a@b.com');
    component.registrationForm.get('orgName')?.setValue('nimbuz');
    component.registrationForm.get('terms')?.setValue(true);

    const error = { error: { error: { message: 'Duplicate user' } } };
    (component as any).handleError(error);

    expect(component.isRegistrationSuccess).toBeFalse();
    expect((mockToastr.error as jasmine.Spy).calls.any()).toBeTrue();
    expect(component.loading).toBeFalse();
  }));

  it('should call forgotPassword flow when url indicates password reset', fakeAsync(() => {
    (mockActivatedRoute as any).queryParams = of({});
    (mockRouter as any).url = '/forgot-password';
    fixture.detectChanges();
    tick();

    component.registrationForm.get('username')?.setValue('user1');
    component.registrationForm.get('password')?.setValue('Abc@1234');
    component.registrationForm.get('email')?.setValue('a@b.com');
    component.registrationForm.get('orgName')?.setValue('nimbuz');
    component.registrationForm.get('terms')?.setValue(true);

    (mockUserService.forgotPassword as jasmine.Spy).and.returnValue(of({}));

    component.onSubmit();
    tick();

    expect(component.isRegistrationSuccess).toBeTrue();
    expect(component.successMessage).toContain('Password reset link sent');
  }));

  it('should toggle password visibility', () => {
    fixture.detectChanges();
    expect(component.visiblePasswordFields.has('pwd')).toBeFalse();
    component.togglePasswordVisibility('pwd');
    expect(component.visiblePasswordFields.has('pwd')).toBeTrue();
  });
});
