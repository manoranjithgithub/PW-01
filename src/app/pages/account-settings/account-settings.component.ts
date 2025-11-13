import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators,  FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AccountSettingsService } from './account-settings.service';
import { SharedService } from '../../shared/services/shared.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { VALIDATION_REGEX } from '../../core/constants/validation-regex.constant';
import { SHARED_IMPORTS } from '../../shared/shared-imports';
import { togglePasswordField } from '../../shared/helpers/password.helper';
@Component({
  selector: 'app-account',
  standalone: true,
  imports: [SHARED_IMPORTS],
  providers: [AccountSettingsService],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss'
})
export class AccountComponent implements OnInit {
  submitted = false;
  accountForm!: FormGroup;
  accountData: any;
  resetPasswordForm!: FormGroup;
  visiblePasswordFields = new Set<string>();
  isResetPasswordSubmitted = false;
  userData: any;
  loading: boolean = false;

  constructor(private fb: FormBuilder, private http: AccountSettingsService, private toaster: ToastrService,
    private sharedService: SharedService, private userService: UserService, private authService: AuthService
  ) { }

  initializeForm(): void {
    this.accountForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      userName: [{ value: '', disabled: true }, Validators.required],
    });

    this.resetPasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.pattern(VALIDATION_REGEX.OLD_PASSWORD)]],
      password: ['', [Validators.required, Validators.pattern(VALIDATION_REGEX.NEW_PASSWORD)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordsMatchValidator });

  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (!password || !confirmPassword) return null;
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...(confirmPassword.errors || {}), mismatch: true });
    } else {
      if (confirmPassword.errors) {
        delete confirmPassword.errors['mismatch'];
        if (!Object.keys(confirmPassword.errors).length) {
          confirmPassword.setErrors(null);
        } else {
          confirmPassword.setErrors(confirmPassword.errors);
        }
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.authService.processDecodedToken(localStorage.getItem('accessToken') || '');
    this.userData = this.sharedService.getUser();
    this.accountForm.patchValue(this.userData);
    this.accountForm.disable();
  }

  isInvalid(controlName: string): boolean {
    const control = this.accountForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.accountForm.invalid) return;
    this.loading = true;
    this.http.updateAccountInfo(this.accountForm.value).subscribe((res: any) => {
      if (res.status.toLowerCase() === 'success') {
        this.sharedService.setUser(res.data);
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        this.toaster.success('Updated successfully');
      }
      this.loading = false;
    });
  }

  onResetPassword(): void {
    this.isResetPasswordSubmitted = true;
    if (this.resetPasswordForm.invalid) return;
    this.loading = true;

    const req = {
      password: this.resetPasswordForm.get('password')?.value,
      oldPassword: this.resetPasswordForm.get('oldPassword')?.value,
      orgName: this.userData?.owner,
      username: this.userData?.userName,
    }
    this.userService.resetPassword(req).subscribe({
      next: (res: any) => {
        if (res.status?.toLowerCase() === 'success') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          this.toaster.success('Password reset successfully');
        }
        this.loading = false;
      },
      error: (err) => {
        this.toaster.error(err?.error?.message || 'Password reset failed');
        this.loading = false;
      }
    });
  }

  togglePassword(field: 'old' | 'new' | 'confirm') {
    togglePasswordField(this.visiblePasswordFields, field);
  }
}