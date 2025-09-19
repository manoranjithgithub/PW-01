import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, Validators, ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormDirective, FormLabelDirective, FormControlDirective, FormFeedbackComponent, InputGroupComponent, InputGroupTextDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ListGroupDirective, ListGroupItemDirective } from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { AccountSettingsService } from './account-settings.service';
import { SharedService } from '../../shared/services/shared.service';
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

  constructor(private fb: FormBuilder, private http: AccountSettingsService, private toaster: ToastrService,
    private sharedService: SharedService
  ) { }

  initializeForm(): void {
    this.accountForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      userName: [{ value: '', disabled: true }, Validators.required],
      avatar: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.http.getAccountInfo().subscribe((res: any) => {
      this.accountData = res.data;
      console.log('AccountInfoData', this.accountData);
      if (this.accountData) {
        this.accountForm.patchValue(this.accountData);
        this.avatarPreview = this.accountData.avatar;
      }
    })
    this.initializeForm();
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

}