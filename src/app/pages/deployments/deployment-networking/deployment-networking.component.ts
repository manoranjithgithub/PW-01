import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  customDnsHost = new FormControl;
  isHostDisabled = true;
  showAuthentication = false;
  deploymentId: string = '';
  showCustomDnsHost: boolean = false;
  deploymentdetails: any;
  isPatchedValue: boolean = true;

  @ViewChild('confirmationModel') private confirmationModel!: ModalComponent;

  public confirmationConfig: any = {
    modalTitle: '',
    width: '500px',
    hideDismissButton: () => true,
    hideCloseButton: () => true,
  };

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

    // freeze flag from input status
    this.freezeAddNewData = this.currentStatus && this.currentStatus === 'Building' ? true : false;

    // compute and apply form disabled state based on freeze flag and permissions
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
        this.networkSettingsForm.get('service')?.setValue(this.deploymentdetails?.name)
        this.getDeploymentById();
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
        : `${envId}.dev.${region}.lb.nimbuz.tech`;
      this.networkSettingsForm.get('host')?.setValue(`${value}-${domainSuffix}`);
      this.isPatchedValue = false
    });
    this.customDnsHost?.valueChanges.subscribe(value => {
      this.networkSettingsForm.get('customDnsHost')?.setValue(value);
      if (!this.isPatchedValue) {
        this.networkSettingsForm.markAsDirty();
      }
    })

    this.deploymentService.getAuthenticatedresponse(envId, this.deploymentId).subscribe((res: any) => {
      this.showAuthenticationData = res.data;
      this.endpointStatus = res.data?.status;
      const customDomain = res.data?.customDomain || '';
      const authentication = this.showAuthenticationData?.authentication || null;

      if (customDomain) { this.isHostDisabled = true; }
      this.customDnsHost.setValue(customDomain);

      if (authentication) {
        this.networkSettingsForm.get('showAuthentication')?.setValue(true, { emitEvent: false },);
      }

      const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
      if (authGroup && authentication?.username && authentication.password) {
        authGroup.patchValue({
          username: authentication.username,
          password: '********'
        }, { emitEvent: false });
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
      control?.valueChanges.subscribe(() => {
        if (this.isPatchedValue) return;
        if (usernameControl && passwordControl) {
          usernameControl?.reset('', { emitEvent: false });
          passwordControl?.reset('', { emitEvent: false });
        }
        if (showAuthControl?.value !== false) {
          showAuthControl?.setValue(false, { emitEvent: false });
        }
      });
    });
  }

  getDeploymentById(): void {
    this.deploymentService.getDeploymentById(this.deploymentdetails?.id).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.ingressDomain = res.data?.network?.appIngressDomain;
        this.showCustomDnsHost = !!res.data.network?.customDomain;

        this.networkSettingsForm.get('customDns')?.setValue(!!res.data.network?.customDomain, { emitEvent: false });
        this.customDnsHost?.setValue(res.data.network?.customDomain, { emitEvent: false });
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
      this.customDnsHost?.setValue('')
      this.networkSettingsForm.get('customDnsHost')?.setValue('')
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
    if (!formValue.showAuthentication) delete formValue.authentication;
    delete formValue.showAuthentication;
    delete formValue.host;
    if (!formValue.customDns) delete formValue.customDnsHost;
    if (this.networkSettingsForm.invalid) {
      return;
    }

    this.deploymentService.createEndpoint(envId, formValue).subscribe((res: any) => {
      if (res && res.status.toLowerCase() === 'success') {
        if (res.data?.customDomain) {
          this.showCustomDnsHost = true;
        } else {
          this.ingressDomain = res.data?.domain;
        }
        this.toaster.success(res.message);
        this.fetchCustomDnsHost();
      } else {
        this.showCustomDnsHost = false;
        this.closeModal()
      }
      this.networkSettingsForm.markAsPristine();
    })
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
      this.customDnsHost.setValue(customDomain);

      if (authentication) {
        this.networkSettingsForm.get('showAuthentication')?.setValue(true);
      }

      const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
      if (authGroup && authentication.username && authentication.password) {
        authGroup.patchValue({
          username: authentication.username,
          password: authentication.password
        });
      }
    });
  }


  shouldEnableButtons(): boolean {
    const auth = this.networkSettingsForm.get('showAuthentication')?.value;
    const dns = this.networkSettingsForm.get('customDns')?.value;
    return !!auth || !!dns;
  }

  closeModal() {
    this.networkSettingsForm.get('customDns')?.setValue(false)
    this.customDnsHost?.setValue('');
    this.networkSettingsForm.get('customDnsHost')?.setValue('');
    this.showCustomDnsHost = false;
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
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }


  copyDomain(domain: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(domain);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = domain;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }
  open(url?: string) {
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    window.open(href, '_blank');
  }
}
