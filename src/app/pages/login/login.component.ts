import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ColorModeService } from '@coreui/angular';
import { togglePasswordField } from '../../shared/helpers/password.helper';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [RouterLink, RouterOutlet, CommonModule, FormsModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit {
  readonly #colorModeService = inject(ColorModeService);
  loginForm !: FormGroup;
  orgName = '';
  submitted: boolean = false;
  isRegistrationSuccess: boolean = false;
  showPassword: boolean = false;
  loading: boolean = false;
  visiblePasswordFields = new Set<string>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toaster: ToastrService,
    private http: UserService,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      orgName: [''],
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    localStorage.setItem('theme-default', JSON.stringify('light'));
    const subdomain = this.getSubdomain();
    this.loginForm.get('orgName')?.setValue(subdomain);
  }

  login() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    this.loading = true;
    this.http.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.toaster.success('Login successful');
        localStorage.setItem('accessToken', response.data.token);
        if (this.authService.isTokenReady()) {
          this.router.navigate(['/projects']);
        }
      },
      error: (error) => {
        this.loading = false;
        if (error.code === 400) {
          this.toaster.error(`Login failed. ${error.error?.error?.message}`);
        } else {
          this.toaster.error(`Login failed. Please check your credentials.`);
        }
      }
    });

  }

  togglePasswordVisibility(field: string): void {
    togglePasswordField(this.visiblePasswordFields, field);
  }

  private getSubdomain(): string {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    const isIndividual = ['localhost', 'app'].includes(subdomain);
    return isIndividual ? 'nimbuz' : subdomain;
  }
}

