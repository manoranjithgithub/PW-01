import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { UserService } from '../../core/services/user.service';
import { PermissionService } from '../../shared/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService, TOAST_CONFIG } from 'ngx-toastr';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ColorModeService } from '@coreui/angular';
import { toastConfigMock } from '../../../test-helpers/testing-mocks';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let userService: jasmine.SpyObj<UserService>;
  let permissionService: jasmine.SpyObj<PermissionService>;
  let authService: jasmine.SpyObj<AuthService>;
  let toaster: jasmine.SpyObj<ToastrService>;
  let router: Router;

  beforeEach(async () => {
    userService = jasmine.createSpyObj('UserService', ['login']);
    permissionService = jasmine.createSpyObj('PermissionService', ['loadPolicies']);
    authService = jasmine.createSpyObj('AuthService', ['isTokenReady']);
    toaster = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: PermissionService, useValue: permissionService },
        { provide: AuthService, useValue: authService },
        { provide: ToastrService, useValue: toaster },
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
        { provide: ColorModeService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/login');
    spyOn(router, 'navigate');

    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('sanity check', () => {
    expect(component.loginForm).toBeDefined();
  });

  it('should initialize loginForm with required controls', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.contains('orgName')).toBeTrue();
    expect(component.loginForm.contains('username')).toBeTrue();
    expect(component.loginForm.contains('password')).toBeTrue();
  });

  it('should set theme-default in localStorage on init', () => {
    component.ngOnInit();
    expect(localStorage.getItem('theme-default')).toBe(JSON.stringify('light'));
  });

  it('should set orgName from subdomain', () => {
    spyOn<any>(component, 'getSubdomain').and.returnValue('testorg');

    component.ngOnInit();

    expect(component.loginForm.get('orgName')?.value).toBe('testorg');
  });

  it('should mark form invalid when required fields are empty', () => {
    component.loginForm.setValue({
      orgName: '',
      username: '',
      password: '',
    });

    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should not call login API when form is invalid', () => {
    component.login();
    expect(userService.login).not.toHaveBeenCalled();
  });

  it('should login successfully and navigate to /projects', fakeAsync(() => {
    component.loginForm.setValue({
      orgName: 'nimbuz',
      username: 'testuser',
      password: 'password123',
    });

    userService.login.and.returnValue(
      of({ data: { token: 'fake-token' } })
    );
    permissionService.loadPolicies.and.returnValue(of([]));
    authService.isTokenReady.and.returnValue(true);

    component.login();
    tick();

    expect(userService.login).toHaveBeenCalledWith(component.loginForm.value);
    expect(permissionService.loadPolicies).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBe('fake-token');
    expect(router.navigate).toHaveBeenCalledWith(['/projects']);
    expect(toaster.success).toHaveBeenCalledWith('Login successful');
  }));

  it('should show error toaster on 400 error', fakeAsync(() => {
    component.loginForm.setValue({
      orgName: 'nimbuz',
      username: 'test',
      password: 'wrong',
    });

    userService.login.and.returnValue(
      throwError(() => ({
        code: 400,
        error: { error: { message: 'Invalid credentials' } },
      }))
    );

    component.login();
    tick();

    expect(component.loading).toBeFalse();
    expect(toaster.error).toHaveBeenCalledWith('Invalid credentials');
  }));

  it('should show generic error toaster on non-400 error', fakeAsync(() => {
    component.loginForm.setValue({
      orgName: 'nimbuz',
      username: 'test',
      password: 'wrong',
    });

    userService.login.and.returnValue(
      throwError(() => ({ code: 500 }))
    );

    component.login();
    tick();

    expect(component.loading).toBeFalse();
    expect(toaster.error).toHaveBeenCalledWith(
      'Login failed. Please check your credentials.'
    );
  }));

  it('should toggle password visibility', () => {
    expect(component.visiblePasswordFields.has('password')).toBeFalse();

    component.togglePasswordVisibility('password');
    expect(component.visiblePasswordFields.has('password')).toBeTrue();

    component.togglePasswordVisibility('password');
    expect(component.visiblePasswordFields.has('password')).toBeFalse();
  });
});
