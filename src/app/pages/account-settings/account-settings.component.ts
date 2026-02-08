import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../shared/services/shared.service';
import { VALIDATION_REGEX } from '../../core/constants/validation-regex.constant';
import { SHARED_IMPORTS } from '../../shared/shared-imports';
import { togglePasswordField } from '../../shared/helpers/password.helper';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { UserService } from '../../core/services/user.service';
import { ModalComponent } from '../../shared/components/model/model.component';
@Component({
  selector: 'app-account',
  standalone: true,
  imports: [SHARED_IMPORTS, LoaderComponent, ModalComponent],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountComponent implements OnInit {
  private userService = inject(UserService);
  @ViewChild('resetPasswordModal') resetPasswordModal!: ModalComponent;
  @ViewChild('removeBillingModal') removeBillingModal!: ModalComponent;
  submitted = false;
  accountForm!: FormGroup;
  resetPasswordForm!: FormGroup;
  billingDetailsForm!: FormGroup;
  visiblePasswordFields = new Set<string>();
  isResetPasswordSubmitted = false;
  userData: any;
  showBillingForm = true;
  hasBillingDetails = false;
  resetPasswordConfig = {
    modalTitle: '',
    width: '640px',
    hideDismissButton: () => false,
    hideCloseButton: () => false,
    dismissButtonLabel: 'Cancel',
    closeButtonLabel: 'Done'
  };
  removeBillingConfig = {
    modalTitle: '',
    width: '520px',
    hideDismissButton: () => true,
    hideCloseButton: () => true
  };

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

    this.billingDetailsForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.maxLength(100)]],
      gstNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
      panNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      addressLine1: ['', [Validators.required, Validators.maxLength(200)]],
      addressLine2: ['', Validators.maxLength(200)],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      state: ['', [Validators.required, Validators.maxLength(50)]],
      country: ['', [Validators.required, Validators.maxLength(50)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    });

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
    this.loadBillingDetails();
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
          this.resetPasswordForm.reset();
          this.isResetPasswordSubmitted = false;
          this.resetPasswordModal?.close();
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

  openResetPasswordModal(): void {
    this.resetPasswordForm.reset();
    this.isResetPasswordSubmitted = false;
    this.visiblePasswordFields.clear();
    this.resetPasswordModal?.open();
  }

  closeResetPasswordModal(): void {
    this.resetPasswordModal?.close();
  }

  isBillingFieldInvalid(controlName: string): boolean {
    const control = this.billingDetailsForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getBillingFieldError(controlName: string): string {
    const control = this.billingDetailsForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
    if (control.errors['pattern']) {
      if (controlName === 'gstNumber') return 'Invalid GST Number format (e.g., 29ABCDE1234F1Z5)';
      if (controlName === 'panNumber') return 'Invalid PAN Number format (e.g., ABCDE1234F)';
      if (controlName === 'postalCode') return 'Invalid Postal Code (6 digits required)';
    }
    return 'Invalid input';
  }

  toUpperCase(controlName: string): void {
    const control = this.billingDetailsForm.get(controlName);
    if (control) {
      const value = control.value;
      if (value) {
        control.setValue(value.toUpperCase(), { emitEvent: false });
      }
    }
  }

  onSubmitBillingDetails(): void {
    if (this.billingDetailsForm.invalid) {
      this.billingDetailsForm.markAllAsTouched();
      return;
    }
    const billingData = {
      ...this.billingDetailsForm.value,
      accountId: localStorage.getItem('accountId')
    };
    this.userService.updateBillingDetails(billingData).subscribe({
      next: (res: any) => {
        if (res.status?.toLowerCase() === 'success') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          this.toaster.success('Billing details updated successfully');
          this.hasBillingDetails = true;
          this.showBillingForm = false;
        }
      },
      error: (err) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.toaster.error(err?.error?.message || 'Failed to update billing details');
      }
    });
  }
  loadBillingDetails(): void {
    this.userService.getBillingDetails(localStorage.getItem('accountId') || '').subscribe({
      next: (res: any) => {
        if (res.status?.toLowerCase() === 'success' && res.data) {
          this.billingDetailsForm.patchValue(res.data);
          this.hasBillingDetails = true;
          this.showBillingForm = false;
        }
      },
      error: (err) => {
        this.toaster.error(err?.error?.message || 'Failed to load billing details');
        
      }
    });
  }

  openBillingForm(): void {
    this.showBillingForm = true;
  }

  closeBillingForm(): void {
    this.showBillingForm = false;
  }

  removeBillingDetails(): void {
    const accountId = localStorage.getItem('accountId') || '';
    if (!accountId) return;
    this.userService.deleteBillingDetails(accountId).subscribe({
      next: (res: any) => {
        if (res.status?.toLowerCase() === 'success') {
          this.toaster.success('Company details removed');
          this.billingDetailsForm.reset();
          this.hasBillingDetails = false;
          this.showBillingForm = true;
          this.removeBillingModal?.close();
        }
      },
      error: (err) => {
        this.toaster.error(err?.error?.message || 'Failed to remove company details');
      }
    });
  }

  openRemoveBillingModal(): void {
    this.removeBillingModal?.open();
  }

  closeRemoveBillingModal(): void {
    this.removeBillingModal?.close();
  }
}
