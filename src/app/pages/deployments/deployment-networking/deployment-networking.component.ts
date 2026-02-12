import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeploymentsService } from '../deployment.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { NgbModal, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { PermissionService } from '../../../shared/services/permission.service';
@Component({
  selector: 'app-deployment-networking',
  standalone: true,
  imports: [SHARED_IMPORTS,
    ConfirmationModalComponent, ModalComponent, NgbPopoverModule],
  templateUrl: './deployment-networking.component.html',
  styleUrl: './deployment-networking.component.scss',
  providers: [DeploymentsService],
  encapsulation: ViewEncapsulation.None
})
export class DeploymentNetworkingComponent implements OnInit {

  @Output() closeModalEvent = new EventEmitter<void>();
  @Input() currentStatus: string = '';
  networkSettingsForm !: FormGroup;
  public formDisabled: boolean = false;
  freezeAddNewData: boolean = false;
  isGenerateDomain: boolean = false;
  showAuthenticationData: any;
  endpointStatus: string = '';
  ingressDomain: string = '';
  hide = true;
  isHostDisabled = true;
  showAuthentication = false;
  deploymentId: string = '';
  showCustomDnsHost: boolean = false;
  deploymentdetails: any;
  isPatchedValue: boolean = true;
  submitted: boolean = false;
  showPasswordIcon = false;
  iscustomDnsHostError: boolean = false;
  dnsInfo: any = {
    dnsName: '',
    ipAddress: ''
  };
  copiedButtonId: string = '';
  ipAddresses = [
    { ip: '101.53.135.137', type: 'Primary', id: 'ip-primary-copy' },
    { ip: '101.53.135.134', type: 'Secondary', id: 'ip-secondary-copy' }
  ];

  // enableAuth: boolean = false;
  // enableCustomDns: boolean = false;
  activeSetting: 'dns' | 'auth' | null = null;
  constructor(private fb: FormBuilder, private deploymentService: DeploymentsService,
    private toaster: ToastrService, private modalService: NgbModal, private ac: ActivatedRoute,
    public permissionService: PermissionService
  ) { }

  ngOnInit(): void {

    this.networkSettingsForm = this.fb.group({
      service: [''],
      host: [''],
      showAuthentication: [false],
      authentication: this.fb.group({
        username: [''],
        password: ['']
      }),
      customDns: [false],
      customDnsHost: ['']
    });

    this.freezeAddNewData = this.currentStatus && this.currentStatus?.toLowerCase() === 'building' ? true : false;

    const shouldDisable = this.freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
    this.formDisabled = shouldDisable;
    if (shouldDisable) {
      this.networkSettingsForm.disable();
    } else {
      this.networkSettingsForm.enable();
    }

    this.ac.queryParams.subscribe(params => {
      const depolyementId = params['id'];
      this.deploymentId = depolyementId;
      this.deploymentService.getDeploymentById(depolyementId).subscribe((res: any) => {
        this.deploymentdetails = res.data;
        this.networkSettingsForm.get('service')?.setValue(this.deploymentdetails?.name);
        this.networkSettingsForm.get('customDnsHost')?.setValue(this.deploymentdetails?.network?.customDomain);
        this.dnsInfo = {
          dnsName: this.deploymentdetails?.network?.customDomain || '',
          ipAddress: res.data?.ipAddress || '101.53.135.137'
        };
        this.getDeploymentById();
        this.freezeAddNewData = res.data?.status.toLowerCase() === 'stopped' || this.currentStatus?.toLowerCase() === 'building' ? true : false;
        const shouldDisable = this.freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
        this.formDisabled = shouldDisable;
      })
    });

    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;

    this.networkSettingsForm.get('service')?.valueChanges.subscribe(value => {
      this.isPatchedValue = true;
      let envType = '';
      const region = 'ap-south-1a';

      if (environment) {
        const envObj = JSON.parse(environment);
        envType = envObj?.type || '';
      }
      const domainSuffix = envType === 'prod'
        ? `${envId}.${region}.lb.nimbuz.tech`
        : `${envId}.dev.lb.nimbuz.tech`;
      this.networkSettingsForm.get('host')?.setValue(`${value}-${domainSuffix}`);
      this.isPatchedValue = false
    });
    this.networkSettingsForm.get('customDnsHost')?.valueChanges.subscribe(value => {
      this.iscustomDnsHostError = false;
      if (!this.isPatchedValue) {
        this.networkSettingsForm.markAsDirty();
      }
    })

    this.deploymentService.getAuthenticatedresponse(envId, this.deploymentId).subscribe((res: any) => {
      this.showAuthenticationData = res.data;
      this.endpointStatus = res.data?.status;
      const customDomain = res.data?.customDomain || '';
      const authentication = this.showAuthenticationData?.authentication || null;
      // this.enableAuth = !!authentication;

      if (customDomain) { this.isHostDisabled = true; }
      this.networkSettingsForm.get('customDnsHost')?.setValue(customDomain);

      this.networkSettingsForm.get('showAuthentication')?.setValue(!!authentication, { emitEvent: false });

      const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
      if (authGroup && authentication?.username && authentication.password) {
        authGroup.patchValue({
          username: authentication.username,
          password: '********'
        }, { emitEvent: false });
      } else {
        authGroup.reset('', { emitEvent: false });
      }
      this.isPatchedValue = false;
      this.networkSettingsForm.markAsPristine();
    });
   
    const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
    const usernameControl = authGroup.get('username');
    const passwordControl = authGroup.get('password');
    const showAuthControl = this.networkSettingsForm.get('showAuthentication');

    ['host', 'customDns', 'customDnsHost'].forEach(field => {
      const control = this.networkSettingsForm.get(field);
      control?.valueChanges.subscribe((x) => {
        if (this.isPatchedValue) return;
        if (field === 'customDns') {
          // this.enableCustomDns = !!control.value;
        }
        
        if (usernameControl && passwordControl) {
          usernameControl?.reset('', { emitEvent: false });
          passwordControl?.reset('', { emitEvent: false });
          authGroup.get('username')?.clearValidators();
          authGroup.get('password')?.clearValidators();
          authGroup.get('username')?.updateValueAndValidity();
          authGroup.get('password')?.updateValueAndValidity();
        }
        if (showAuthControl?.value !== false) {
          showAuthControl?.setValue(false, { emitEvent: false });
        }
      });
    });
    // this.networkSettingsForm.get('showAuthentication')?.valueChanges.subscribe(value => {
    //   this.enableAuth = !!value;
    // })

  }

  getDeploymentById(): void {
    this.deploymentService.getDeploymentById(this.deploymentdetails?.id).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.ingressDomain = res.data?.network?.appIngressDomain;
        this.showCustomDnsHost = !!res.data.network?.customDomain;
        // this.enableCustomDns = !!res.data.network?.customDomain;

        this.networkSettingsForm.get('customDns')?.setValue(!!res.data.network?.customDomain, { emitEvent: false });
        this.networkSettingsForm.get('customDnsHost')?.setValue(res.data.network?.customDomain, { emitEvent: false });
        this.networkSettingsForm.markAsPristine();
      }
    });
  }

  toggleVisibility(): void {
    this.hide = !this.hide;
  }

  toggleHost(event: Event): void {
    this.isHostDisabled = !(event.target as HTMLInputElement).checked;
    const hostControl = this.networkSettingsForm.get('host');
    if (this.isHostDisabled) {
      hostControl?.disable();
      this.networkSettingsForm.get('customDnsHost')?.setValue('')
      this.networkSettingsForm.markAsPristine();
      this.onNetworkingSubmit()
    } else {
      hostControl?.enable();
    }
  }

  onNetworkingSubmit(): void {
    this.isGenerateDomain = false;
    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;
    const formValue = this.networkSettingsForm.value
    if (formValue.customDns && (formValue.customDnsHost == '' || formValue.customDnsHost == null)) {
      this.iscustomDnsHostError = true;
      return;
    } else {
      this.iscustomDnsHostError = false;
    }
    if (!formValue.showAuthentication) delete formValue.authentication;
    delete formValue.showAuthentication;
    delete formValue.host;
    if (!formValue.customDns) delete formValue.customDnsHost;
    if (this.networkSettingsForm.invalid) {
      this.submitted = true;
      return;
    }

    this.deploymentService.createEndpoint(envId, formValue).subscribe((res: any) => {
      if (res && res.status.toLowerCase() === 'success') {
        if (res.data?.customDomain) {
          this.showCustomDnsHost = true;
          this.networkSettingsForm.get('customDnsHost')?.setValue(res.data.customDomain);
        } else {
          this.ingressDomain = res.data?.domain;
        }
        this.submitted = false;
        this.toaster.success(res.message);
        this.fetchCustomDnsHost();
      } else {
        this.showCustomDnsHost = false;
        this.closeModal()
      }
      this.networkSettingsForm.markAsPristine();
    })
  }

  onCustomDnsSubmit(): void {
    const hostname = this.networkSettingsForm.get('customDnsHost')?.value;
    if (!hostname) {
      this.iscustomDnsHostError = true;
      return;
    }
    this.iscustomDnsHostError = false;

    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;
    this.deploymentService.createEndpoint(envId, { customDnsHost: hostname, customDns: true, service: this.deploymentdetails?.name }).subscribe((res: any) => {
      if (res && res.status.toLowerCase() === 'success') {
        this.toaster.success('Custom DNS updated successfully');
        this.showCustomDnsHost = true;
        this.networkSettingsForm.get('customDnsHost')?.setValue(hostname);
        this.networkSettingsForm.markAsPristine();
        const domainSuffix = `${hostname}.${this.getEnvId()}.nimbuz.tech`;
        this.dnsInfo = {
          dnsName: domainSuffix,
          ipAddress: res.data?.ipAddress || '101.53.135.137'
        };
        this.fetchCustomDnsHost();
      } else {
        this.toaster.error('Failed to update Custom DNS');
      }
    }, error => {
      this.toaster.error('Error updating Custom DNS');
    });
    // API call to get DNS and IP information

  }

  onAuthenticationSubmit(): void {
    const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
    const username = authGroup.get('username')?.value;
    const password = authGroup.get('password')?.value;

    if (!username) {
      this.toaster.error('Username is required');
      return;
    }
    if (!password || password === '') {
      this.toaster.error('Password is required');
      return;
    }

    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;

    const authData = {
      username: username,
      password: password
    };

    // Save authentication
    this.deploymentService.createEndpoint(envId, { authentication: authData, service: this.deploymentdetails?.name }).subscribe((res: any) => {
      if (res && res.status.toLowerCase() === 'success') {
        this.toaster.success('Authentication configured successfully');
        authGroup.markAsPristine();
      } else {
        this.toaster.error('Failed to configure authentication');
      }
    }, error => {
      this.toaster.error('Error configuring authentication');
    });
  }

  cancelAuthentication(): void {
    const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
    authGroup.reset('', { emitEvent: false });
    this.networkSettingsForm.get('showAuthentication')?.setValue(false, { emitEvent: false });
    this.showAuthentication = false;
    this.showPasswordIcon = false;
    this.toaster.info('Authentication cancelled');
  }

  getEnvId(): string {
    const environment = localStorage.getItem('environment');
    return environment ? JSON.parse(environment).id : 'default';
  }

  deleteEndpoint() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Endpoint';
    modalRef.componentInstance.message = 'Are you sure you want to delete this endpoint?';

    modalRef.result.then(
      (result) => {
        if (result) {
          const environment = localStorage.getItem('environment');
          const envId = environment ? JSON.parse(environment).id : null;
          this.deploymentService.deleteEndpoint(envId, this.deploymentdetails?.name).subscribe((res: any) => {
            if (res.status.toLowerCase() === "success") {
              this.toaster.success(res.message);
              this.ingressDomain = '';
              scrollTo(0, 0);
            }
          }, error => {
            scrollTo(0, 0);

          });
        } else {
          console.log('Cancelled delete endpoint!');
        }
      });
  }

  fetchCustomDnsHost() {
    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;
    this.deploymentService.getAuthenticatedresponse(envId, this.deploymentId).subscribe((res: any) => {
      this.showAuthenticationData = res.data;
      this.endpointStatus = res.data?.status;
      const customDomain = res.data?.customDomain || '';
      const authentication = this.showAuthenticationData?.authentication || null;

      if (customDomain) { this.isHostDisabled = true; }
      // this.customDnsHost.setValue(customDomain);

      this.networkSettingsForm.get('showAuthentication')?.setValue(!!authentication, { emitEvent: false });

      const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
      if (authGroup && authentication?.username && authentication?.password) {
        authGroup.patchValue({
          username: authentication.username,
          password: '********'
        }, { emitEvent: false });
      } else {
        authGroup.reset('', { emitEvent: false });
      }
      this.showPasswordIcon = false;
    });
  }


  shouldEnableButtons(): boolean {
    const auth = this.networkSettingsForm.get('showAuthentication')?.value;
    const dns = this.networkSettingsForm.get('customDns')?.value;
    return !!auth || !!dns;
  }

  closeModal() {
    this.networkSettingsForm.get('customDns')?.setValue(false)
    this.networkSettingsForm.get('customDnsHost')?.setValue('');
    this.showCustomDnsHost = false;
    this.dnsInfo = { dnsName: '', ipAddress: '' };
    // this.confirmationModel.close()
  }

  toggleAuthentication(event: Event): void {
    this.showAuthentication = (event.target as HTMLInputElement).checked;
    this.networkSettingsForm.get('showAuthentication')?.setValue(this.showAuthentication);
    this.updateAuthenticationValidation();
  }
  private updateAuthenticationValidation(): void {
    const authGroup = this.authentication;

    if (this.showAuthentication) {
      authGroup.get('username')?.setValidators(Validators.required);
      authGroup.get('password')?.setValidators(Validators.required);
    } else {
      authGroup.get('username')?.clearValidators();
      authGroup.get('password')?.clearValidators();
    }
    authGroup.get('username')?.updateValueAndValidity();
    authGroup.get('password')?.updateValueAndValidity();
  }
  get authentication(): FormGroup {
    return this.networkSettingsForm.get('authentication') as FormGroup;
  }
  isInvalid(controlName: string): boolean {
    const control = this.networkSettingsForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched || this.submitted) : false;
  }


  copyDomain(domain: string | null | undefined, buttonId: string = '') {
    const valueToCopy = domain ?? '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(valueToCopy).then(() => {
        this.copiedButtonId = buttonId;
        setTimeout(() => {
          this.copiedButtonId = '';
        }, 2000);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = valueToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copiedButtonId = buttonId;
      setTimeout(() => {
        this.copiedButtonId = '';
      }, 2000);
    }
  }
  open(url?: string) {
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    window.open(href, '_blank');
  }
  clearPasswordField() {
    const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
    authGroup.get('password')?.setValue('');
  }
  onPasswordChange() {
    this.showPasswordIcon = true;
  }
  // onEnableCustomDnsChange(event: any) {
  //   this.networkSettingsForm.get('customDns')?.setValue(event.target.checked);
  // }
  // onEnableAuthChange(event: any) {
  //   this.networkSettingsForm.get('showAuthentication')?.setValue(event.target.checked);
  // }
}
