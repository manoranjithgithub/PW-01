import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, Validators, ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormDirective, FormLabelDirective, FormControlDirective, FormFeedbackComponent, InputGroupComponent, InputGroupTextDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ListGroupDirective, ListGroupItemDirective } from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { AccountSettingsService } from './account-settings.service';
import { SharedService } from '../../shared/services/shared.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-account',
  standalone: true,
  imports: [RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, ReactiveFormsModule, FormsModule, FormDirective, FormLabelDirective, FormControlDirective, FormFeedbackComponent, InputGroupComponent, InputGroupTextDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ListGroupDirective, ListGroupItemDirective, CommonModule],
  providers: [AccountSettingsService],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss'
})
export class AccountComponent implements OnInit {
  submitted = false;
  accountForm!: FormGroup;
  avatarPreview: string = '';
  accountData: any;
  resetPasswordForm!: FormGroup;
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isResetPasswordSubmitted = false;
  userData: any;

  constructor(private fb: FormBuilder, private http: AccountSettingsService, private toaster: ToastrService,
    private sharedService: SharedService, private userService: UserService, private authService: AuthService
  ) { }

  initializeForm(): void {
    this.accountForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      userName: [{ value: '', disabled: true }, Validators.required],
      // avatar: ['', Validators.required],
    });

    this.resetPasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
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
    this.accountData = localStorage.getItem('profileSettings') ? JSON.parse(localStorage.getItem('profileSettings') || '{}') : null;
    this.accountForm.patchValue(this.accountData);
    this.accountForm.disable()
    // this.http.getAccountInfo().subscribe((res: any) => {
    //   this.accountData = res.data;
    //   console.log('AccountInfoData', this.accountData);
    //   if (this.accountData) {
    //     this.accountForm.patchValue(this.accountData);
    //     this.avatarPreview = this.accountData.avatar;
    //   }
    // })

  }

  isInvalid(controlName: string): boolean {
    const control = this.accountForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.accountForm.invalid) return;

    this.http.updateAccountInfo(this.accountForm.value).subscribe((res: any) => {
      console.log('AccountInfoUpdate', this.accountForm.value);
      if (res.status.toLowerCase() === 'success') {
        this.sharedService.setUser(res.data);
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        this.toaster.success('Updated successfully');
      }
    })
  }

  updateAvatarPreview(): void {
    this.avatarPreview = this.accountForm.get('avatar')?.value;
  }
  onResetPassword(): void {
    this.isResetPasswordSubmitted = true;
    if (this.resetPasswordForm.invalid) return;
    const req = {
      password: this.resetPasswordForm.get('password')?.value,
      oldPassword: this.resetPasswordForm.get('oldPassword')?.value,
      orgName: this.userData?.owner,
      username: this.userData?.userName,
    }
    this.userService.resetPassword(req).subscribe((res: any) => {
      if (res.status.toLowerCase() === 'success') {
        this.toaster.success('Password reset successfully');
      }
    })
  }

  togglePassword(field: 'old' | 'new' | 'confirm') {
    if (field === 'old') this.showOldPassword = !this.showOldPassword;
    if (field === 'new') this.showNewPassword = !this.showNewPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }
}