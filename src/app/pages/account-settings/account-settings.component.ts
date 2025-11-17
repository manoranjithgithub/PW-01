import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../shared/services/shared.service';
import { VALIDATION_REGEX } from '../../core/constants/validation-regex.constant';
import { SHARED_IMPORTS } from '../../shared/shared-imports';
import { togglePasswordField } from '../../shared/helpers/password.helper';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { UserService } from '../../core/services/user.service';
@Component({
  selector: 'app-account',
  standalone: true,
  imports: [SHARED_IMPORTS, LoaderComponent],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountComponent implements OnInit {
  private userService = inject(UserService);
  submitted = false;
  accountForm!: FormGroup;
  resetPasswordForm!: FormGroup;
  visiblePasswordFields = new Set<string>();
  isResetPasswordSubmitted = false;
  userData: any;

  constructor(private fb: FormBuilder, private toaster: ToastrService,
    private sharedService: SharedService
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
    this.userData = this.sharedService.getUser();
    this.accountForm.patchValue(this.userData);
    this.accountForm.disable();
  }

  isInvalid(controlName: string): boolean {
    const control = this.accountForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  onResetPassword(): void {
    this.isResetPasswordSubmitted = true;
    if (this.resetPasswordForm.invalid) return;
    this.sharedService.show();
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
        this.sharedService.hide();
      },
      error: (err) => {
        this.toaster.error(err?.error?.message || 'Password reset failed');
        this.sharedService.hide();
      }
    });
  }

  togglePassword(field: 'old' | 'new' | 'confirm') {
    togglePasswordField(this.visiblePasswordFields, field);
  }
}