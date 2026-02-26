import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { PermissionService } from '../../../shared/services/permission.service';
@Component({
  selector: 'app-deployment-settings',
  standalone: true,
  imports: [AccordionComponent,
    AccordionItemComponent,
    TemplateIdDirective, ModalComponent,
    AccordionButtonDirective, ReactiveFormsModule, CommonModule, CalloutComponent,
    FormCheckComponent, FormsModule, TooltipDirective, AlertComponent, MatIconModule, NgbPopoverModule],
  templateUrl: './deployment-settings.component.html',
  styleUrl: './deployment-settings.component.scss',
  providers: [DeploymentsService],
  encapsulation: ViewEncapsulation.None
})
export class DeploymentSettingsComponent implements OnInit, AfterViewInit, OnChanges {
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
  allowedFileTypes: string[] = ['.zip', '.tar', '.rar'];
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
  public formDisabled: boolean = false;
  endpointStatus: string = '';
  s3FileKey: string = '';
  isAutoScaleEnabled: boolean = false;

  constructor(private fb: FormBuilder, private sharedService: SharedService, private deploymentService: DeploymentsService,
    private toaster: ToastrService, private modalService: NgbModal, private route: Router, private ac: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private viewportScroller: ViewportScroller, public permissionService: PermissionService
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStatus']) {
      this.freezeAddNewData = this.currentStatus && this.currentStatus?.toLowerCase() === 'building' ? true : false;
      this.formDisabled = this.freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
      if (this.formDisabled) {
        this.generalSettingsForm?.disable?.();
        this.sourceSettingsForm?.disable?.();
      } else {
        this.generalSettingsForm?.enable?.();
        this.sourceSettingsForm?.enable?.();
      }
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const fragment = this.ac.snapshot.fragment;
      if (fragment) {
        this.viewportScroller.scrollToAnchor(fragment);
      }
    }, 100);
  }

  formatCurrency(value: number | undefined, fromCurrency?: string): string {
    if (value == null || isNaN(Number(value))) return '';
    const target = this.sharedService.getCurrency() || 'USD';
    const converted = this.sharedService.convertAmount(Number(value), fromCurrency, target);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: target,
        minimumFractionDigits: 4,
      }).format(converted);
    } catch (e) {
      return String(converted);
    }
  }

  ngOnInit(): void {
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
      replicas: ['', [Validators.required, Validators.min(1)]],
      hpaEnabled: [false],
      hpaMinReplicas: ['', [Validators.pattern('^[0-9]+$'), Validators.min(1)]],
      hpaMaxReplicas: ['', [Validators.pattern('^[0-9]+$')]],
      ephemeralStorage: [null, Validators.pattern("^[0-9]*\\.?[0-9]+$")],
      storage: [null, Validators.pattern("^[0-9]+$")],
      healthEndpoint: ['', [Validators.maxLength(250), Validators.pattern('^/.*')]],
      port: ['', [Validators.maxLength(5), Validators.pattern('^[0-9]+$'), Validators.min(1),
      Validators.max(65535)]],
      buildCommand: ['', Validators.maxLength(250)],
      startCommand: ['', Validators.maxLength(250)],
      installCommand: ['', Validators.maxLength(250)],
      folderPath: [null],
      dockerFileName: [null],
      // dockerfilePath: ['', Validators.maxLength(250)],

    })

    this.sourceSettingsForm = this.fb.group({
      type: [{ value: '', disabled: true }],
      provider: [{ value: '', disabled: true }],
      repoUrl: [{ value: '', disabled: true }],
      branchName: [{ value: '', disabled: true }],
      fileInput: ['', [Validators.required, this.fileValidator.bind(this)]],
      fileName: [{ value: '', disabled: true }],
      // dockerfilePath: ['', Validators.maxLength(250)],
      dockerFileName: [{ value: '', disabled: true }],
      folderPath: [{ value: '', disabled: true }],
      vcsAutoDeploy: [false],
    });
    this.freezeAddNewData = this.currentStatus && this.currentStatus?.toLowerCase() === 'building' ? true : false;

    const shouldDisable = this.freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
    this.formDisabled = shouldDisable;
    if (shouldDisable) {
      this.generalSettingsForm?.disable?.();
      this.sourceSettingsForm?.disable?.();
    } else {
      this.generalSettingsForm?.enable?.();
      // this.sourceSettingsForm?.enable?.();
    }
    this.ac.queryParams.subscribe(params => {
      const depolyementId = params['id'];
      this.deploymentService.getDeploymentById(depolyementId).subscribe((res: any) => {
        this.deploymentdetails = res.data;
        this.freezeAddNewData = res.data?.status.toLowerCase() === 'stopped' || this.currentStatus?.toLowerCase() === 'building' ? true : false;
        const shouldDisable = this.freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
        this.formDisabled = shouldDisable;
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
      const items = Array.isArray(res?.data) ? res.data.slice() : [];
      items.sort((a: any, b: any) => {
        const pa = parseFloat(String(a.price || a.instanceHourRate || '').replace(/[^0-9.]/g, '')) || 0;
        const pb = parseFloat(String(b.price || b.instanceHourRate || '').replace(/[^0-9.]/g, '')) || 0;
        return pa - pb;
      });
      this.resources = items;
    });

    // update view when currency changes
    this.sharedService.currencyChange$.subscribe(() => {
      this.cdr.detectChanges();
    });

    this.generalSettingsForm.get('instanceType')?.valueChanges.subscribe(selectedValue => {
      this.selectedResource = selectedValue;
      // console.log("Selected Object:", this.selectedResource);
    });

    this.generalSettingsForm.get('hpaEnabled')?.valueChanges.subscribe(value => {
      this.isAutoScaleEnabled = value;
      this.toggleAutoScale(value);
    })
    // Revalidate hpaMaxReplicas when hpaMinReplicas changes
    this.generalSettingsForm.get('hpaMinReplicas')?.valueChanges.subscribe(() => {
      this.generalSettingsForm.get('hpaMaxReplicas')?.updateValueAndValidity();
    });

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
    this.deploymentService.getDeploymentById(this.deploymentdetails?.id).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        const rawGitUrl = res.data.sourceCode?.gitUrl || '';
        const [urlPart, , branch] = rawGitUrl?.split(' ') || [];
        const cleanUrl = urlPart?.replace(/\/\/.*@/, '//').replace(/\.git$/, '') || '';
        const provider = cleanUrl?.split('/')[2]?.split('.')[0] || '';
        const repoUrl = cleanUrl;
        const branchName = branch || '';
        const patchInstanceType = this.resources.find(resource => resource.instanceType === res.data.application?.instanceType);

        this.generalSettingsForm.patchValue({
          name: res.data.name,
          instanceType: patchInstanceType,
          region: 'ap-south-1a',
          replicas: res.data.application?.replicas,
          hpaMinReplicas: res.data.hpa?.hpaMinReplicas,
          hpaMaxReplicas: res.data.hpa?.hpaMaxReplicas,
          hpaEnabled: res.data.hpa?.hpaEnabled,
          ephemeralStorage: res.data.application?.ephemeralStorage ? res.data.application?.ephemeralStorage.replace(/Gi$/, '') : null,
          storage: res.data.application?.storage,
          healthEndpoint: res.data.network?.healthEndpoint,
          port: res.data.network?.port,
          buildCommand: res.data.buildConfig?.buildCommand,
          startCommand: res.data.buildConfig?.startCommand,
          installCommand: res.data.buildConfig?.installCommand,
          // dockerfilePath: res.data.sourceCode?.dockerfilePath || '',
          folderPath: res.data.sourceCode?.folderPath || '',
          dockerFileName: res.data.sourceCode?.dockerFileName || '',
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
          fileName: res.data.sourceCode?.s3FileKey ? res.data.sourceCode?.s3FileKey : '',
          // dockerfilePath: res.data.sourceCode?.dockerfilePath || '',
          dockerFileName: res.data.sourceCode?.dockerFileName || '',
          folderPath: res.data.sourceCode?.folderPath || '',
          vcsAutoDeploy: res.data.sourceCode?.vcsAutoDeploy || false,
        });
        if (res.data.sourceCode?.type.toLowerCase() === "file") {
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
    // const selectedName = this.generalSettingsForm.get('instanceType')?.value;

    const selectedResource = this.generalSettingsForm.get('instanceType')?.value;

    if (!selectedResource) return;

    this.selectedResource = selectedResource;

    let selectedCPU = 0;
    if (selectedResource.cpuVcpu.endsWith('m')) {
      selectedCPU = parseFloat(selectedResource.cpuVcpu.replace('m', '')) / 1000;
    } else {
      selectedCPU = parseFloat(selectedResource.cpuVcpu);
    }

    // Memory Conversion from mi/gi to GB 
    let selectedRAM = 0;
    if (selectedResource.memoryGb.toLowerCase().endsWith('gi')) {
      selectedRAM = parseFloat(selectedResource.memoryGb);
    } else if (selectedResource.memoryGb.toLowerCase().endsWith('mi')) {
      selectedRAM = parseFloat(selectedResource.memoryGb) / 1024;
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
      if (this.selectedFile) {
        const extension = this.selectedFile.name.split('.').pop()?.toLowerCase() || '';
        this.deploymentService.getS3Details(extension).pipe(
          concatMap((res: any) => {
            if (!res?.data) {
              throw new Error('Failed to get S3 details');
            }
            const s3Data = res.data;
            return this.deploymentService.uploadFileToS3(
              s3Data.uploadUrl,
              this.selectedFile,
              s3Data.contentType
            ).pipe(
              tap(() => this.s3FileKey = s3Data.s3Key),
              concatMap(() =>
                this.deploymentService.updateDeployment(this.deploymentdetails?.id, {
                  sourceCode: { s3FileKey: this.s3FileKey, type: 'file' }
                })
              )
            );
          })
        ).subscribe({
          next: (res: any) => {
            this.isSourceSettingsChanged = false;
            if (res.status.toLowerCase() === "success") {
              this.toaster.success('File uploaded and deployment updated successfully');
            }
          },
          error: (err) => {
            console.error('Error during file upload or update:', err);
          }
        });
      }
    }
  }

  onGeneralSubmit(): void {
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
      instanceType: formValue.instanceType?.instanceType,
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
    const baseData = {
      type: sourceFormValue.type,
      gitUrl: this.buildGitUrl(),
      s3FileKey: fileName ? this.s3FileKey : null,
      // dockerfilePath: sourceFormValue.dockerfilePath
        folderPath: sourceFormValue.folderPath,
        dockerFileName: sourceFormValue.dockerFileName,
    };
    const hpa= {
      hpaEnabled: formValue.hpaEnabled,
      hpaMinReplicas: formValue.hpaEnabled ? formValue.hpaMinReplicas :1,
      hpaMaxReplicas: formValue.hpaEnabled ? formValue.hpaMaxReplicas :1,
    };

    const isDockerfilePathChanged =
      // formValue.dockerfilePath !== sourceFormValue.dockerfilePath;
        formValue.folderPath !== sourceFormValue.folderPath ||
        formValue.dockerFileName !== sourceFormValue.dockerFileName;

    if (isDockerfilePathChanged) {
      // baseData.dockerfilePath = formValue.dockerfilePath;
        baseData.folderPath = formValue.folderPath;
        baseData.dockerFileName = formValue.dockerFileName;
    }

    const sourceCode = isDockerfilePathChanged
      ? baseData
      : this.getChangedFields(baseData, originalSource);

    const nameChanged = this.getChangedFields({ name: formValue.name }, { name: this.deploymentdetails?.name });

    const req: any = {};
    if (Object.keys(nameChanged).length) req.name = nameChanged.name;
    if (Object.keys(sourceCode).length) req.sourceCode = sourceCode;
    if (Object.keys(application).length) req.application = application;
    if (Object.keys(network).length) req.network = network;
    if (Object.keys(hpa).length) req.hpa = hpa;
    if (this.isAutoScaleEnabled) {
      delete req.application.replicas;
    } else {
      // delete req.hpa.hpaMinReplicas;
      // delete req.hpa.hpaMaxReplicas;
    }
    this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.toaster.success('Updated successfully');
        this.sourceSettingsForm.patchValue({
          type: res.data.sourceCode?.type.toLowerCase(),
        });
        this.generalSettingsForm.patchValue({
          name: res.data.name,
          instanceType: res.data.application?.instanceType,
          region: 'ap-south-1a',
          replicas: res.data.application?.replicas,
          hpaMinReplicas: res.data.hpa?.hpaMinReplicas,
          hpaMaxReplicas: res.data.hpa?.hpaMaxReplicas,
          hpaEnabled: res.data.hpa?.hpaEnabled,
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

  hpaMaxReplicasValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const hpaMinReplicas = this.generalSettingsForm?.get('hpaMinReplicas')?.value;
      const hpaMaxReplicas = control.value;

      if (hpaMinReplicas && hpaMaxReplicas) {
        const minVal = parseInt(hpaMinReplicas, 10);
        const maxVal = parseInt(hpaMaxReplicas, 10);

        if (maxVal <= minVal) {
          return { maxLessThanMin: true };
        }
      }
      return null;
    };
  }

  toggleAutoScale(value?: boolean) {
    if (value) {
      this.generalSettingsForm.get('replicas')?.setValue('');
      this.generalSettingsForm.get('replicas')?.clearValidators();
      this.generalSettingsForm.get('replicas')?.updateValueAndValidity();
      this.generalSettingsForm.get('hpaMinReplicas')?.setValidators([Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1)]);
      this.generalSettingsForm.get('hpaMaxReplicas')?.setValidators([Validators.required, Validators.pattern('^[0-9]+$'), this.hpaMaxReplicasValidator()]);
      this.generalSettingsForm.get('hpaMinReplicas')?.updateValueAndValidity();
      this.generalSettingsForm.get('hpaMaxReplicas')?.updateValueAndValidity();
    } else {
      this.generalSettingsForm.get('replicas')?.setValue('1');
      this.generalSettingsForm.get('replicas')?.setValidators([Validators.required, Validators.min(1)]);
      this.generalSettingsForm.get('replicas')?.updateValueAndValidity();
      // this.generalSettingsForm.get('hpaMinReplicas')?.setValue('');
      // this.generalSettingsForm.get('hpaMaxReplicas')?.setValue('');
      this.generalSettingsForm.get('hpaMinReplicas')?.clearValidators();
      this.generalSettingsForm.get('hpaMaxReplicas')?.clearValidators();
      this.generalSettingsForm.get('hpaMinReplicas')?.updateValueAndValidity();
      this.generalSettingsForm.get('hpaMaxReplicas')?.updateValueAndValidity();
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

  public getCurrentProjectId(): string | undefined {
    const p = localStorage.getItem('project');
    if (!p || p === 'undefined') return undefined;
    try {
      const parsed = JSON.parse(p);
      return parsed?.id || undefined;
    } catch {
      return p || undefined;
    }
  }

  public getCurrentEnvId(): string | undefined {
    const e = localStorage.getItem('environment');
    if (!e || e === 'undefined') return undefined;
    try {
      const parsed = JSON.parse(e);
      return parsed?.id || undefined;
    } catch {
      return e || undefined;
    }
  }
  onVcsAutoDeployChange() {
    const vcsAutoDeploy = this.sourceSettingsForm.get('vcsAutoDeploy')?.value;
    this.deploymentService.updateDeployment(this.deploymentdetails?.id, {
      sourceCode: { 
        vcsAutoDeploy: vcsAutoDeploy,
        type: this.deploymentdetails?.sourceCode?.type || 'vcs',
        gitUrl: this.deploymentdetails?.sourceCode?.gitUrl || '',
        s3FileKey: this.deploymentdetails?.sourceCode?.s3FileKey || '',
        // dockerfilePath: this.deploymentdetails?.sourceCode?.dockerfilePath || '',
        folderPath: this.deploymentdetails?.sourceCode?.folderPath || '',
        dockerFileName: this.deploymentdetails?.sourceCode?.dockerFileName || '',
       }
    }).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.toaster.success('VCS Auto Deploy setting updated successfully');
      }
    },
      err => {
        console.error(err);
      });
  }
}