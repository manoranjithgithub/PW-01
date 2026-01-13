import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { VALIDATION_REGEX } from '../../core/constants/validation-regex.constant';
import { togglePasswordField } from '../../shared/helpers/password.helper';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  submitted: boolean = false;
  isRegistrationSuccess: boolean = false;
  showPassword: boolean = false;
  currentUrl: string = '';
  successMessage: string = '';
  loading: boolean = false;
  visiblePasswordFields = new Set<string>();
  forgotPasswordForm !: FormGroup;


  constructor(
    private fb: FormBuilder,
    private http: UserService,
    private router: Router,
    private toaster: ToastrService,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.pattern(VALIDATION_REGEX.NEW_PASSWORD)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (!password || !confirmPassword) {
      return null;
    }
    if (confirmPassword.value && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    if (confirmPassword.hasError('passwordMismatch')) {
      const errors = confirmPassword.errors;
      delete errors!['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors!).length ? errors : null);
    }

    return null;
  }

  ngOnInit(): void {
    this.currentUrl = this.router.url;
  }

  private handleSuccess(): void {
    this.loading = false;
    this.isRegistrationSuccess = true;

    this.successMessage = `Password reset link sent!
Please check your email for instructions to reset your password.`;
  }

  private handleError(error: any): void {
    this.loading = false;
    this.isRegistrationSuccess = false;

    const message = error?.error?.error?.message || 'Something went wrong';
    this.toaster.error(message);
  }


  togglePasswordVisibility(field: string): void {
    togglePasswordField(this.visiblePasswordFields, field);
  }
  submitForgotPassword(): void {
    this.submitted = true;
    if (this.forgotPasswordForm.invalid) return;
    const type = this.getSubDomain().clientId;
    this.loading = true;
    delete this.forgotPasswordForm.value.confirmPassword;
    const finalPayload = {
      ...this.forgotPasswordForm.value,
      type: type === 'nimbuz' ? 'individual' : 'business',
      orgName: type === 'nimbuz' ? 'nimbuz' : type
    };
    this.http.forgotPassword(finalPayload).subscribe({
      next: () => {
        this.handleSuccess();
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }
  getSubDomain(): any {
    const domain = this.authService.getClientInfo();
    return domain;
  }
}
