import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountComponent } from './account-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { SharedService } from '../../shared/services/shared.service';
import { UserService } from '../../core/services/user.service';
import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';

describe('AccountComponent (Jasmine)', () => {
  let fixture: ComponentFixture<AccountComponent>;
  let component: AccountComponent;
  let mockSharedService: jasmine.SpyObj<SharedService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockToastr: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    mockSharedService = jasmine.createSpyObj('SharedService', ['getUser', 'show', 'hide']);
    mockUserService = jasmine.createSpyObj('UserService', ['resetPassword']);
    mockToastr = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    mockSharedService.getUser.and.returnValue({ name: '', email: '', userName: '' } as any);

    await TestBed.configureTestingModule({
      imports: [AccountComponent, HttpClientTestingModule, ToastrModule.forRoot()],
      providers: [
        { provide: SharedService, useValue: mockSharedService },
        { provide: UserService, useValue: mockUserService },
        { provide: ToastrService, useValue: mockToastr },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

  });

  it('should not call resetPassword when reset form is invalid', () => {
    component.initializeForm();
    component.resetPasswordForm.patchValue({ oldPassword: '', password: '', confirmPassword: '' });
    component.isResetPasswordSubmitted = false;
    component.onResetPassword();
    expect(mockSharedService.show).not.toHaveBeenCalled();
    expect(mockUserService.resetPassword).not.toHaveBeenCalled();
  });

  it('should call resetPassword and show success flow on successful response', () => {
    component.initializeForm();
    component.userData = { owner: 'org', userName: 'user' };
    component.resetPasswordForm.patchValue({
      oldPassword: 'Old@1234',
      password: 'New@1234',
      confirmPassword: 'New@1234'
    });
    mockUserService.resetPassword.and.returnValue(of({ status: 'success' }));
    spyOn(window, 'scrollTo');
    component.onResetPassword();
    expect(mockSharedService.show).toHaveBeenCalled();
    expect(mockUserService.resetPassword).toHaveBeenCalledWith({
      password: 'New@1234',
      oldPassword: 'Old@1234',
      orgName: 'org',
      username: 'user'
    });
    expect(mockToastr.success).toHaveBeenCalledWith('Password reset successfully');
    expect(mockSharedService.hide).toHaveBeenCalled();
  });

  it('should show error toast and hide loader on resetPassword error', () => {
    component.initializeForm();
    component.userData = { owner: 'org', userName: 'user' };
    component.resetPasswordForm.patchValue({
      oldPassword: 'Old@1234',
      password: 'New@1234',
      confirmPassword: 'New@1234'
    });
    mockUserService.resetPassword.and.returnValue(throwError({ error: { message: 'failed' } }));
    component.onResetPassword();
    expect(mockToastr.error).toHaveBeenCalledWith('failed');
    expect(mockSharedService.hide).toHaveBeenCalled();
  });

  it('passwordsMatchValidator sets mismatch error when passwords differ', () => {
    component.initializeForm();
    component.resetPasswordForm.get('password')?.setValue('abc');
    component.resetPasswordForm.get('confirmPassword')?.setValue('def');
    component.passwordsMatchValidator(component.resetPasswordForm);
    expect(component.resetPasswordForm.get('confirmPassword')?.errors?.['mismatch']).toBeTrue();
  });

  it('passwordsMatchValidator clears mismatch when passwords match', () => {
    component.initializeForm();
    component.resetPasswordForm.get('password')?.setValue('Same@123');
    component.resetPasswordForm.get('confirmPassword')?.setValue('Same@123');
    // first set a mismatch then validate equal to ensure clearing logic works
    component.resetPasswordForm.get('confirmPassword')?.setErrors({ mismatch: true, required: false } as any);
    component.passwordsMatchValidator(component.resetPasswordForm);
    expect(component.resetPasswordForm.get('confirmPassword')?.errors?.['mismatch']).toBeUndefined();
  });

  it('initializeForm creates controls with validators', () => {
    component.initializeForm();
    const acc = component.accountForm;
    expect(acc.get('name')).toBeTruthy();
    expect(acc.get('email')).toBeTruthy();
    expect(acc.get('userName')).toBeTruthy();
    // userName control should be disabled by default
    expect(acc.get('userName')?.disabled).toBeTrue();
    const reset = component.resetPasswordForm;
    expect(reset.get('oldPassword')).toBeTruthy();
    expect(reset.get('password')).toBeTruthy();
    expect(reset.get('confirmPassword')).toBeTruthy();
  });

  it('ngOnInit patches userData and disables accountForm', () => {
    // override getUser to return meaningful data and recreate component
    mockSharedService.getUser.and.returnValue({ name: 'John', email: 'j@e.com', userName: 'jdoe' } as any);
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.userData).toEqual({ name: 'John', email: 'j@e.com', userName: 'jdoe' });
    expect(component.accountForm.disabled).toBeTrue();
    expect(component.accountForm.get('name')?.value).toBe('John');
    expect(component.accountForm.get('email')?.value).toBe('j@e.com');
  });

  it('isInvalid returns true when control invalid and touched/dirty', () => {
    component.initializeForm();
    const nameCtrl = component.accountForm.get('name');
    nameCtrl?.setValue('');
    nameCtrl?.markAsTouched();
    nameCtrl?.markAsDirty();
    expect(component.isInvalid('name')).toBeTrue();
  });

  it('togglePassword toggles visiblePasswordFields set', () => {
    expect(component.visiblePasswordFields.has('old')).toBeFalse();
    component.togglePassword('old');
    expect(component.visiblePasswordFields.has('old')).toBeTrue();
    component.togglePassword('old');
    expect(component.visiblePasswordFields.has('old')).toBeFalse();
  });
});