import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';

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


  constructor(
    private fb: FormBuilder,
    private http: UserService,
    private router: Router,
    private toaster: ToastrService
  ) { }

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.isPasswordReset = this.currentUrl.includes('forgot-password');

    this.registrationForm = this.fb.group({
      type: ['individual', Validators.required],
      orgName: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      username: ['', [Validators.required, Validators.pattern(/^(?![_-])(?!.*[_-]{2})(?!.*\s)[A-Za-z0-9_-]+(?<![_-])$/)]],
      password: ['', [Validators.required, Validators.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]:;"'<>,.?\/|\\~`])[^\s]{8,}$/
      )]],
      email: ['', [Validators.required, Validators.email]],
      terms: [false, this.isPasswordReset ? [] : Validators.requiredTrue]
    });

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
    if (this.registrationForm.invalid) {
      this.submitted = true;
      return;
    }
    delete this.registrationForm.value.terms;
    this.loading = true;
    if (this.isPasswordReset) {
      this.http.forgotPassword(this.registrationForm.value).subscribe({
        next: (response) => {
          this.successMessage = `Password reset link sent!\nPlease check your email for instructions to reset your password.`;
          this.isRegistrationSuccess = true;
          this.loading = false;
        },
        error: (error) => {
          this.isRegistrationSuccess = false;
          this.toaster.error(error.error.error?.message);
          this.loading = false;
        }
      });
    } else {
      this.http.register(this.registrationForm.value).subscribe({
        next: (response) => {
          this.successMessage = `Registration Successful!\nThank you for registering with us.\nWe've sent verification details to your registered email address. Please follow the instructions in the email to log in and get started.`;
          this.isRegistrationSuccess = true;
          this.loading = false;
        },
        error: (error) => {
          this.isRegistrationSuccess = false;
          this.loading = false;
          this.toaster.error(error.error.error?.message);
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}