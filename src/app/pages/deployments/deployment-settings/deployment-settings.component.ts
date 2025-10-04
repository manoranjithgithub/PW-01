import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AccordionButtonDirective,
  AccordionComponent,
  AccordionItemComponent,
  TemplateIdDirective,
  CalloutComponent,
  FormCheckComponent,
  AlertComponent,
  TooltipDirective
} from '@coreui/angular';
import { ResourceQuotaComponent } from '../../settings/resource-quota/resource-quota.component';
import { CommonModule, ViewportScroller } from '@angular/common';
import { SharedService } from '../../../shared/services/shared.service';
import { DeploymentsService } from '../deployment.service';
import { ToastrService } from 'ngx-toastr';
import { DEPLOYMENT_TYPES } from '../../../shared/constants/nimbuz.constant';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { concatMap, tap } from 'rxjs';
@Component({
  selector: 'app-deployment-settings',
  standalone: true,
  imports: [AccordionComponent,
    AccordionItemComponent,
    TemplateIdDirective, ModalComponent,
    AccordionButtonDirective, ReactiveFormsModule, ResourceQuotaComponent, CommonModule, CalloutComponent,
    FormCheckComponent, FormsModule, TooltipDirective, AlertComponent, MatIconModule, NgbPopoverModule],
  templateUrl: './deployment-settings.component.html',
  styleUrl: './deployment-settings.component.scss',
  providers: [DeploymentsService],
  encapsulation: ViewEncapsulation.None
})
export class DeploymentSettingsComponent implements OnInit, AfterViewInit {
  domainValue = '3.15.124.155';


  @Output() closeModalEvent = new EventEmitter<void>();
  generalSettingsForm !: FormGroup;
  sourceSettingsForm!: FormGroup;
  networkSettingsForm !: FormGroup;
  buildSettingsForm !: FormGroup;
  deploySettingsForm !: FormGroup;
  deploymentdetails: any;
  isGenerateDomain: boolean = false;
  isCustomDomain: boolean = false;
  deploymentId: string = '';
  showAuthenticationData: any;

  zipUpload: boolean = false;
  vcsDeploy: boolean = false;
  allowedFileTypes: string[] = ['.zip', '.tar'];
  fileError: string = '';
  selectedFile: File | null = null;
  serviceList: any;

  type = DEPLOYMENT_TYPES;
  showAuthentication = false;
  hide = true;
  isHostDisabled = true;
  isView: boolean = false;
  showCustomDnsHost: boolean = false;
  storageValidation: string = 'Enter in unit: Gi';
  cpuQuota: any = 0;
  ramQuota: any = 0;
  ephemeralQuota: any = 0;
  ephemeralExhausted: boolean = false;
  cpuExhausted: boolean = false;
  ramExhausted: boolean = false;
  resources: any[] = [];
  selectedResource: any;
  resourceAllocationDetails: any;
  fileUploadedSuccessfully: boolean = false;

  overprovisioned: boolean = false;
  underprovisioned: boolean = false;
  isGeneralSettingsChanged = false;
  isSourceSettingsChanged = false;
  generalcurrentValues: any;
  sourcecurrentValues: any;

  @ViewChild('confirmationModel') private confirmationModel!: ModalComponent;


  public confirmationConfig: any = {
    modalTitle: '',
    width: '500px',
    hideDismissButton: () => true,
    hideCloseButton: () => true,
  };
  customDnsHost = new FormControl;
  ingressDomain: string = '';
  @Input() currentStatus: string = '';
  freezeAddNewData: boolean = false;
  endpointStatus: string = '';
  s3FileKey: string = '';

  constructor(private fb: FormBuilder, private sharedService: SharedService, private deploymentService: DeploymentsService,
    private toaster: ToastrService, private modalService: NgbModal, private route: Router, private ac: ActivatedRoute,
    private viewportScroller: ViewportScroller
  ) { }

  ngAfterViewInit() {
    setTimeout(() => {
      const fragment = this.ac.snapshot.fragment;
      if (fragment) {
        this.viewportScroller.scrollToAnchor(fragment);
      }
    }, 100);
  }

  ngOnInit(): void {
    this.freezeAddNewData = this.currentStatus && this.currentStatus?.toLowerCase() === 'building' ? true : false;
    // const environment = this.sharedService.getCookie('environment');
    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;

    this.ac.queryParams.subscribe(params => {
      this.deploymentId = params['id'];
      if (!this.deploymentId) {
        this.toaster.error('Deployment ID is missing in the URL');
        return;
      }
    });

    this.generalSettingsForm = this.fb.group({
      name: ['', Validators.maxLength(40)],
      instanceType: ['', Validators.required],
      region: [{ value: '', disabled: true }],
      replicas: ['', Validators.required],
      ephemeralStorage: [null, Validators.pattern("^[0-9]*\\.?[0-9]+$")],
      storage: [null, Validators.pattern("^[0-9]+$")],
      healthEndpoint: [''],
      port: ['', [Validators.maxLength(5), Validators.pattern('^[0-9]+$')]],
      buildCommand: ['', Validators.maxLength(250)],
      startCommand: ['', Validators.maxLength(250)],
      installCommand: ['', Validators.maxLength(250)],
    })

    this.sourceSettingsForm = this.fb.group({
      type: [{ value: '', disabled: true }],
      provider: [{ value: '', disabled: true }],
      repoUrl: [{ value: '', disabled: true }],
      branchName: [{ value: '', disabled: true }],
      fileInput: ['', [Validators.required, this.fileValidator.bind(this)]],
      fileName: [{ value: '', disabled: true }]
    });
    this.ac.queryParams.subscribe(params => {
      const depolyementId = params['id'];
      this.deploymentService.getDeploymentById(depolyementId).subscribe((res: any) => {
        this.deploymentdetails = res.data;
        //this.networkSettingsForm.get('service')?.setValue(this.deploymentdetails?.name)
        this.getDeploymentById();
      })
    });

    this.getDeployments();

    const resourceUsage = JSON.parse(localStorage.getItem('resourceUsage') || '[]');
    const cpuResource = resourceUsage.find(
      (res: any) => res.resource_type === 'CPU'
    );
    const ramResource = resourceUsage.find(
      (res: any) => res.resource_type === 'RAM'
    );
    const ephemeralResource = resourceUsage.find(
      (res: any) => res.resource_type === 'ephemeral_storage'
    );

    this.cpuQuota = cpuResource;
    this.ramQuota = ramResource;
    this.ephemeralQuota = ephemeralResource;

    this.deploymentService.getInstanceTypes().subscribe((res: any) => {
      // this.configForm.patchValue(res.data)
      this.resources = Object.entries(res.data).map(([key, value]) => ({
        name: key.trim(),
        ...(value as object)
      }));

    });

    this.generalSettingsForm.get('instanceType')?.valueChanges.subscribe(selectedValue => {
      this.selectedResource = this.resources.find(
        resource => resource.name === selectedValue
      );
      // console.log("Selected Object:", this.selectedResource);
    });

    this.deploymentService.getAuthenticatedresponse(envId, this.deploymentId).subscribe((res: any) => {
      this.showAuthenticationData = res.data;
      this.endpointStatus = res.data?.status;
      const customDomain = res.data.customDomain || '';
      const authentication = this.showAuthenticationData?.authentication || null;

      if (customDomain) { this.isHostDisabled = true; }
      this.customDnsHost.setValue(customDomain);

      if (authentication) {
        this.networkSettingsForm.get('showAuthentication')?.setValue(true);
      }

      const authGroup = this.networkSettingsForm?.get('authentication') as FormGroup;
      if (authGroup && authentication.username && authentication.password) {
        authGroup.patchValue({
          username: authentication.username,
          password: authentication.password
        });
      }
    });


  }



  getDeploymentById(): void {
    // const regionCookie = this.sharedService.getCookie('region');
    const regionCookie = localStorage.getItem('region');
    this.deploymentService.getDeploymentById(this.deploymentdetails?.id).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        // this.ingressDomain = res.data?.app_ingress_domain;
        // this.showCustomDnsHost = !!res.data.is_custom_dns;
        //General settings
        const rawGitUrl = res.data.sourceCode?.gitUrl || '';
        const [urlPart, , branch] = rawGitUrl?.split(' ') || [];
        const cleanUrl = urlPart?.replace(/\/\/.*@/, '//').replace(/\.git$/, '') || '';
        const provider = cleanUrl?.split('/')[2]?.split('.')[0] || '';
        const repoUrl = cleanUrl;
        const branchName = branch || '';

        this.generalSettingsForm.patchValue({
          name: res.data.name,
          instanceType: res.data.application?.instanceType,
          region: regionCookie,
          replicas: res.data.application?.replicas,
          ephemeralStorage: res.data.application?.ephemeralStorage ? res.data.application?.ephemeralStorage.replace(/Gi$/, '') : null,
          storage: res.data.application?.storage,
          healthEndpoint: res.data.network?.healthEndpoint,
          port: res.data.network?.port,
          buildCommand: res.data.buildConfig?.buildCommand,
          startCommand: res.data.buildConfig?.startCommand,
          installCommand: res.data.buildConfig?.installCommand
        });

        const initialValues = this.generalSettingsForm.value;

        this.generalSettingsForm.valueChanges.subscribe(currentValues => {
          this.isGeneralSettingsChanged = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
        });
        this.sourceSettingsForm.patchValue({
          type: res.data.sourceCode?.type.toLowerCase(),
          provider: provider,
          repoUrl: repoUrl,
          branchName: branchName,
          fileName: res.data.sourceCode?.s3FileKey ? res.data.sourceCode?.s3FileKey : ''
        });
        if(res.data.sourceCode?.type.toLowerCase() === "file"){
          this.s3FileKey = res.data.sourceCode?.s3FileKey;
        }
        if (this.sourceSettingsForm.get('type')?.value?.toLowerCase() === "vcs") {
          this.zipUpload = false;
          this.vcsDeploy = true;
        }
        else if (this.sourceSettingsForm.get('type')?.value === "file") {
          this.zipUpload = true;
          this.vcsDeploy = false;
        }

        const loadingValues = this.sourceSettingsForm.value;

        this.sourceSettingsForm.valueChanges.subscribe(currentValues => {
          this.isSourceSettingsChanged = JSON.stringify(currentValues) !== JSON.stringify(loadingValues);
        });
        this.generalcurrentValues = this.generalSettingsForm.value;
        this.sourcecurrentValues = this.sourceSettingsForm.value;
      }
    });
  }

  onInstanceTypeChange(): void {
    const selectedName = this.generalSettingsForm.get('instanceType')?.value;

    const selectedResource = this.resources.find(r => r.name === selectedName);

    if (!selectedResource) return;

    this.selectedResource = selectedResource;

    let selectedCPU = 0;
    if (selectedResource.cpu.endsWith('m')) {
      selectedCPU = parseFloat(selectedResource.cpu.replace('m', '')) / 1000;
    } else {
      selectedCPU = parseFloat(selectedResource.cpu);
    }

    // Memory Conversion from mi/gi to GB 
    let selectedRAM = 0;
    if (selectedResource.memory.toLowerCase().endsWith('gi')) {
      selectedRAM = parseFloat(selectedResource.memory);
    } else if (selectedResource.memory.toLowerCase().endsWith('mi')) {
      selectedRAM = parseFloat(selectedResource.memory) / 1024;
    }
    // Calculate remaining values
    if (selectedCPU > this.cpuQuota?.remaining) {
      this.cpuExhausted = true;
      this.generalSettingsForm.setErrors({ invalid: true });
    }
    else {
      this.cpuExhausted = false;
      this.generalSettingsForm.setErrors(null);
    }
    if (selectedRAM > this.ramQuota?.remaining) {
      this.ramExhausted = true;
      this.generalSettingsForm.setErrors({ invalid: true });
    }
    else {
      this.ramExhausted = false;
      this.generalSettingsForm.setErrors(null);
    }
  }

  fileValidator(control: any): { [key: string]: boolean } | null {
    const file = control.value;
    if (file) {
      const fileExtension = file.split('.').pop()?.toLowerCase();
      if (!this.allowedFileTypes.includes(`.${fileExtension}`)) {
        return { invalidFileType: true };
      }
    }
    return null;
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      if (file.size > 500_000_000) {
        this.toaster.error('File size too large.');
        this.fileError = 'File size large';
      }
      else {
        const fileNameWithoutExtension = this.removeFileExtension(file.name);
        this.sourceSettingsForm.get('fileName')?.patchValue(fileNameWithoutExtension)
      }
    }
  }

  removeFileExtension(fileName: string): string {
    const fileNameParts = fileName.split('.');
    if (fileNameParts.length > 1) {
      fileNameParts.pop();
    }
    return fileNameParts.join('.');
  }

  onZipUpload(): void {
    if (this.sourceSettingsForm.invalid) {
      this.fileError = 'Please select a valid file to upload.';
    }
    else {
      // const environment = this.sharedService.getCookie('environment');
      // const environment = localStorage.getItem('environment');
      // const envId = environment ? JSON.parse(environment).id : null;
      // if (this.selectedFile && envId) {
      //   const formData = new FormData();

      if (this.selectedFile) {
        //     formData.append('file', this.selectedFile, this.selectedFile.name);
        //   }
        //   formData.append('type', 'ZIP');
        //   formData.append('appName', this.generalSettingsForm.get('name')?.value);
        const extension = this.selectedFile.name.split('.').pop()?.toLowerCase() || '';
        this.deploymentService.getS3Details(extension).pipe(
          concatMap((res: any) => {
            if (!res?.data) throw new Error('Failed to get S3 details');
            const s3Data = res.data;
            return this.deploymentService.uploadFileToS3(s3Data.uploadUrl, this.selectedFile, s3Data.contentType).pipe(
              tap(() => {
                this.s3FileKey = s3Data.s3Key;
              })
            );
          })
        );

        // this.deploymentService.uploadZipDeployment(envId, formData).subscribe((res: any) => {
        //   if (res.status === 'Success') {
        //     this.fileError = '';
        //     this.sourceSettingsForm.get('fileName')?.patchValue(this.selectedFile?.name);
        //     this.fileUploadedSuccessfully = true;
        //     this.toaster.success('File uploaded successfully');
        //   }
        // },
        //   err => {
        //     this.fileUploadedSuccessfully = false;
        //     // this.toaster.error('Error uploading file');
        //     console.error(err);
        //   })
      }
    }
  }

  onGeneralSubmit(): void {
    const regionCookie = localStorage.getItem('region');
    if (this.generalSettingsForm.invalid) {
      this.generalSettingsForm.markAllAsTouched();
      return;
    }
    const formValue = this.generalSettingsForm.getRawValue();
    const sourceFormValue = this.sourceSettingsForm.getRawValue();
    const fileName = sourceFormValue.fileName?.trim();

    const originalApp = { ...(this.deploymentdetails?.application || {}), ...(this.deploymentdetails?.buildConfig || {}) };
    const originalNetwork = this.deploymentdetails?.network || {};
    const originalSource = this.deploymentdetails?.sourceCode || {};

    const application = this.getChangedFields({
      replicas: formValue.replicas,
      instanceType: formValue.instanceType,
      installCommand: formValue.installCommand,
      buildCommand: formValue.buildCommand,
      startCommand: formValue.startCommand,
      ephemeralStorage: formValue.ephemeralStorage ? `${formValue.ephemeralStorage}Gi` : null,
      storage: formValue.storage,
    }, originalApp);
    const network = this.getChangedFields({
      healthEndpoint: formValue.healthEndpoint,
      port: formValue.port,
    }, originalNetwork);

    const sourceCode = this.getChangedFields({
      type: sourceFormValue.type,
      gitUrl: this.buildGitUrl(),
      s3FileKey: fileName ? this.s3FileKey : null,

    }, originalSource);
    const nameChanged = this.getChangedFields({ name: formValue.name }, { name: this.deploymentdetails?.name });

    const req: any = {};
    if (Object.keys(nameChanged).length) req.name = nameChanged.name;
    if (Object.keys(sourceCode).length) req.sourceCode = sourceCode;
    if (Object.keys(application).length) req.application = application;
    if (Object.keys(network).length) req.network = network;
    this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.toaster.success('Updated successfully');
        this.sourceSettingsForm.patchValue({
          type: res.data.sourceCode?.type.toLowerCase(),
        });
        this.generalSettingsForm.patchValue({
          name: res.data.name,
          instanceType: res.data.application?.instanceType,
          region: regionCookie,
          replicas: res.data.application?.replicas,
          ephemeralStorage: res.data.application?.ephemeralStorage ? res.data.application?.ephemeralStorage.replace(/Gi$/, '') : null,
          storage: res.data.application?.storage,
          healthEndpoint: res.data.network?.healthEndpoint,
          port: res.data.network?.port,
          buildCommand: res.data.application?.buildCommand,
          startCommand: res.data.application?.startCommand,
          installCommand: res.data.application?.installCommand
        });
        this.isGeneralSettingsChanged = false;
        this.isSourceSettingsChanged = false;
      }
    },
      err => {
        console.error(err);
      });
  }

  onSourceSubmit(): void {
    console.log(this.sourceSettingsForm.value);
    let req: any = {
      type: this.deploymentdetails?.type,
      stageToExecute: "BuildDeploy",
      status: this.deploymentdetails?.status,
    };
    if (this.zipUpload) {
      req = {
        ...req,
        fileName: this.sourceSettingsForm?.get('fileName')?.value,
      };
    }
    else if (this.vcsDeploy) {
      req = {
        ...req,
        provider: this.deploymentdetails?.provider,
        repoUrl: this.sourceSettingsForm.value.repoUrl,
        branchName: this.sourceSettingsForm.value.branchName,
      };
    }
    this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.toaster.success('Updated successfully');
      }
    },
      err => {
        // this.toaster.error('Error updating source settings in deployment');
        console.error(err);
      });
  }


  onBuildSubmit(): void {
    console.log(this.buildSettingsForm.value);
    const formValue = this.buildSettingsForm.value;
    const req = {
      ...formValue,
      stageToExecute: "BuildDeploy",
      status: this.deploymentdetails?.status,
    }
    this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
      if (res.status === "Success") {
        this.toaster.success(res.message);
      }
    },
      err => {
        // this.toaster.error('Error updating build settings in deployment');
        console.error(err);
      });
  }

  onDeploySubmit(): void {
    console.log(this.deploySettingsForm.value);
    const formValue = this.deploySettingsForm.value;
    const req = {
      ...formValue,
      stageToExecute: "BuildDeploy",
      status: this.deploymentdetails?.status,
    }
    this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.toaster.success('Updated successfully');
      }
    },
      err => {
        // this.toaster.error('Error updating deploy settings in deployment');
        console.error(err);
      });
  }

  deleteDeployment(): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Deployment';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.deploymentService.deleteDeployment(this.deploymentdetails?.id).subscribe((res: any) => {
            if (res.status.toLowerCase() === "success") {
              this.toaster.success(res.message);
              // this.route.navigate(['/deployment']);
              window.location.href = '/deployment'
              this.onCloseClicked();
            }
          });
        }
        else {
          console.log('Cancelled delete environment!');
        }

      });
  }

  onCloseClicked() {
    this.closeModalEvent.emit();
  }

  getDeployments(): void {
    // const environment = this.sharedService.getCookie('environment');
    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;
    if (envId) {
      this.deploymentService.getDeployments(envId).subscribe((res: any) => {
        if (res.status === "Success") {
          this.serviceList = res.data;
        }
      },
        err => {

        });
    }
  }

  copyDomainValue(inputElement: HTMLInputElement): void {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
  }

  onEphemeralMouseOut() {
    const value = this.generalSettingsForm.get('ephemeralStorage')?.value;
    const ephemeralStorage = parseFloat(value.replace(/[^\d.]/g, ''));
    if (ephemeralStorage > this.ephemeralQuota?.remaining) {
      this.ephemeralExhausted = true;
      this.generalSettingsForm.setErrors({ invalid: true });
    }
    else {
      this.ephemeralExhausted = false;
      this.generalSettingsForm.setErrors(null);
    }
  }

  isError(controlName: string, errorType: string): boolean {
    const control = this.generalSettingsForm.controls[controlName];
    return control.hasError(errorType) && control.touched;
  }

  Port() {
    const portControl = this.generalSettingsForm.get('port');
    if (portControl && portControl.value === '') {
      portControl.setValue(null, { emitEvent: false });
    }
  }

  private getChangedFields(current: any, original: any): any {
    const changed: any = {};
    Object.keys(current).forEach(key => {
      const currVal = current[key];
      const origVal = original ? original[key] : undefined;
      if (currVal === null || currVal === undefined) return;

      if (typeof currVal === 'string' && typeof origVal === 'string') {
        if (currVal.trim() !== origVal.trim()) {
          changed[key] = currVal;
        }
      } else if (currVal !== origVal) {
        changed[key] = currVal;
      }
    });
    return changed;
  }

  private buildGitUrl(): string {
    const repo = this.sourceSettingsForm.get('repoUrl')?.value.replace(/^(https?:\/\/)?(www\.)?[^/]+\//, '') || '';
    const branch = this.sourceSettingsForm.get('branchName')?.value || 'main';

    if (this.sourceSettingsForm.get('provider')?.value === 'github') {
      return `https://token@github.com/${repo}.git -b ${branch}`;
    }
    if (this.sourceSettingsForm.get('provider')?.value === 'gitlab') {
      return `https://${repo}:token@gitlab.com/${repo}.git -b ${branch}`;
    }
    return '';
  }
}