import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { VALIDATION_REGEX } from '../../core/constants/validation-regex.constant';
import { togglePasswordField } from '../../shared/helpers/password.helper';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [RouterLink, RouterOutlet, CommonModule, ReactiveFormsModule]
})

export class RegisterComponent implements OnInit {

  registrationForm !: FormGroup;
  submitted: boolean = false;
  isRegistrationSuccess: boolean = false;
  showPassword: boolean = false;
  currentUrl: string = '';
  successMessage: string = '';
  isPasswordReset: boolean = false;
  loading: boolean = false;
  visiblePasswordFields = new Set<string>();
  createdBy : string | null = null;


  constructor(
    private fb: FormBuilder,
    private http: UserService,
    private router: Router,
    private toaster: ToastrService,
    private ac: ActivatedRoute
  ) {
    this.registrationForm = this.fb.group({
      type: ['individual', Validators.required],
      orgName: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      username: ['', [Validators.required, Validators.pattern(VALIDATION_REGEX.USERNAME)]],
      password: ['', [Validators.required, Validators.pattern(VALIDATION_REGEX.NEW_PASSWORD)]],
      email: ['', [Validators.required, Validators.email]],
      terms: [false]
    });
  }

  ngOnInit(): void {
    this.ac.queryParams.subscribe(params => {
      this.registrationForm.get('type')?.setValue(params['type'] || 'individual');
      this.createdBy = params['createdBy'] || null;
    });
    this.currentUrl = this.router.url;
    this.isPasswordReset = this.currentUrl.includes('forgot-password');
    this.registrationForm.get('terms')?.setValidators(this.isPasswordReset ? [] : Validators.requiredTrue);

    this.registrationForm.get('type')?.valueChanges.subscribe((typeValue) => {
      if (typeValue === 'individual') {
        this.registrationForm.get('orgName')?.setValue('nimbuz');
      } else {
        this.registrationForm.get('orgName')?.reset('');
      }
    });

    if (this.registrationForm.get('type')?.value === 'individual') {
      this.registrationForm.get('orgName')?.setValue('nimbuz');
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.registrationForm.invalid) return;
    this.loading = true;
    const { terms, ...finalPayload } = this.registrationForm.value;
    const apiCall = this.isPasswordReset
      ? this.http.forgotPassword(finalPayload)
      : this.http.register(finalPayload);

    apiCall.subscribe({
      next: () => {
        this.handleSuccess();
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }

  private handleSuccess(): void {
    this.loading = false;
    this.isRegistrationSuccess = true;

    this.successMessage = this.isPasswordReset
      ? `Password reset link sent!
Please check your email for instructions to reset your password.`
      : `Registration Successful!
Thank you for registering with us.
We've sent verification details to your registered email address. Please follow the instructions to log in.`;
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
}