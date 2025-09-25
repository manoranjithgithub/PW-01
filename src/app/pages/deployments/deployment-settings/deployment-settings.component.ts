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
import { env } from 'process';
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
  originalCommands = {
    installCommand: '',
    buildCommand: '',
    startCommand: '',
    zip_file_name: ''
  };
  isGeneralSettingsChanged = false;
  isSourceSettingsChanged = false;

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

    // this.networkSettingsForm = this.fb.group({
    //   service: [''],
    //   host: [''],
    //   showAuthentication: [false],
    //   authentication: this.fb.group({
    //     username: [''],
    //     password: ['']
    //   }),
    //   customDns: [false],
    //   customDnsHost: ['']
    //   // serviceDomainPort : [''],
    //   // customDomainPort : [''],
    //   // privateNetworkUrl : ['']
    // });

    // this.buildSettingsForm = this.fb.group({
    //   buildCommand: ['']
    // });

    // this.deploySettingsForm = this.fb.group({
    //   startCommand: ['']
    // });

    // this.sharedService.deploymentData$.subscribe(data => {
    //   this.deploymentdetails = data;
    //   if (this.deploymentdetails) {
    //     this.networkSettingsForm.get('service')?.setValue(this.deploymentdetails?.name)
    //     this.getDeploymentById();
    //   }
    // });
    this.ac.queryParams.subscribe(params => {
      const depolyementId = params['id'];
      this.deploymentService.getDeploymentById(depolyementId).subscribe((res: any) => {
        this.deploymentdetails = res.data;
        //this.networkSettingsForm.get('service')?.setValue(this.deploymentdetails?.name)
        this.getDeploymentById();
      })
    });

    this.getDeployments();
    // this.networkSettingsForm.get('service')?.valueChanges.subscribe(value => {
    //   let envType = '';
    //   const region = localStorage.getItem('region') || 'ap-south-1a';

    //   if (environment) {
    //     const envObj = JSON.parse(environment);
    //     envType = envObj?.type || '';
    //   }
    //   const domainSuffix = envType === 'prod'
    //     ? `${envId}.${region}.lb.nimbuz.tech`
    //     : `${envId}.dev.${region}.lb.nimbuz.tech`;
    //   this.networkSettingsForm.get('host')?.setValue(`${value}-${domainSuffix}`);
    // });
    // this.customDnsHost?.valueChanges.subscribe(value => {
    //   this.networkSettingsForm.get('customDnsHost')?.setValue(value)
    // })
    //.dev.ap-south-1a.lb.nimbuz.tech
    // const resourceUsage = JSON.parse(this.sharedService.getCookie('resourceUsage'));
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
      // const defaultResource = this.resources.find(r => r.name === 'atto.r');

      // if (defaultResource) {
      //   this.generalSettingsForm.get('instanceType')?.setValue(defaultResource.name);
      //   this.selectedResource = defaultResource;
      // }
    });

    this.generalSettingsForm.get('instanceType')?.valueChanges.subscribe(selectedValue => {
      this.selectedResource = this.resources.find(
        resource => resource.name === selectedValue
      );
      // console.log("Selected Object:", this.selectedResource);
    });

    // this.deploymentService.getAuthenticatedresponse(envId, this.deploymentId).subscribe((res: any) => {
    //   this.showAuthenticationData = res.data;
    //   this.endpointStatus = res.data?.status;
    //   const customDomain = res.data.customDomain || '';
    //   const authentication = this.showAuthenticationData?.authentication || null;

    //   if (customDomain) { this.isHostDisabled = true; }
    //   this.customDnsHost.setValue(customDomain);

    //   if (authentication) {
    //     this.networkSettingsForm.get('showAuthentication')?.setValue(true);
    //   }

    //   const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
    //   if (authGroup && authentication.username && authentication.password) {
    //     authGroup.patchValue({
    //       username: authentication.username,
    //       password: authentication.password
    //     });
    //   }
    // });

    this.getResourceAllocationStatus(this.deploymentId);

  }

  getResourceAllocationStatus(deploymentId: string): void {
    // this.deploymentService.getDeploymentResourceAllocation(deploymentId).subscribe((res: any) => {
    //   if (res.status === "Success") {
    //     this.resourceAllocationDetails = res.data;
    //     if (this.resourceAllocationDetails) {
    //       if (this.resourceAllocationDetails.deployment_state === 'overprovisioned') {
    //         this.overprovisioned = true;
    //         this.underprovisioned = false;
    //       }
    //       else if (this.resourceAllocationDetails.deployment_state === 'underprovisioned') {
    //         this.overprovisioned = false;
    //         this.underprovisioned = true;
    //       }
    //       else {
    //         this.overprovisioned = false;
    //         this.underprovisioned = false;
    //       }
    //     }
    //   } else {
    //     this.toaster.error(res.message);
    //   }
    // });
  }

  getDeploymentById(): void {
    // const regionCookie = this.sharedService.getCookie('region');
    const regionCookie = localStorage.getItem('region');
    this.deploymentService.getDeploymentById(this.deploymentdetails?.id).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        // this.ingressDomain = res.data?.app_ingress_domain;
        // this.showCustomDnsHost = !!res.data.is_custom_dns;
        //General settings
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

        this.originalCommands.buildCommand = res.data.application?.buildCommand;
        this.originalCommands.installCommand = res.data.application?.installCommand;
        this.originalCommands.startCommand = res.data.application?.startCommand;
        // this.originalCommands.zip_file_name = res.data.zip_file_name;

        const initialValues = this.generalSettingsForm.value;

        this.generalSettingsForm.valueChanges.subscribe(currentValues => {
          this.isGeneralSettingsChanged = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
        });
        //Source
        this.sourceSettingsForm.patchValue({
          type: res.data.sourceCode?.type.toLowerCase(),
          // provider: res.data.provider,
          // repoUrl: res.data.repo_url,
          // branchName: res.data.branch_name,
          // fileName: res.data.zip_file_name,
          // fileInput: ''
        });
        if (this.sourceSettingsForm.get('type')?.value?.toLowerCase() === "vcs") {
          this.zipUpload = false;
          this.vcsDeploy = true;
        }
        else if (this.sourceSettingsForm.get('type')?.value === "zip") {
          this.zipUpload = true;
          this.vcsDeploy = false;
        }

        const loadingValues = this.sourceSettingsForm.value;

        this.sourceSettingsForm.valueChanges.subscribe(currentValues => {
          this.isSourceSettingsChanged = JSON.stringify(currentValues) !== JSON.stringify(loadingValues);
        });
        ///////////////////////////
        // this.networkSettingsForm.get('customDns')?.setValue(!!res.data.is_custom_dns)
        // this.customDnsHost?.setValue(res.data.custom_domain)
        //Build
        // this.buildSettingsForm.setValue({ build_command: res.data.build_command });

        //Deploy
        // this.deploySettingsForm.setValue({ start_command: res.data.start_command });
      }
    });
  }

  onInstanceTypeChange(): void {
    const selectedName = this.generalSettingsForm.get('instanceType')?.value;

    const selectedResource = this.resources.find(r => r.name === selectedName);

    if (!selectedResource) return;

    this.selectedResource = selectedResource;

    // const rawPrice = parseFloat(selectedResource.price.replace('$', '')); 
    // this.selectedResource.price = `$${rawPrice.toFixed(2)}`;
    // CPU conversion from m to core
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
      const environment = localStorage.getItem('environment');
      const envId = environment ? JSON.parse(environment).id : null;
      if (this.selectedFile && envId) {
        const formData = new FormData();

        if (this.selectedFile) {
          formData.append('file', this.selectedFile, this.selectedFile.name);
        }
        formData.append('type', 'ZIP');
        formData.append('appName', this.generalSettingsForm.get('name')?.value);

        this.deploymentService.uploadZipDeployment(envId, formData).subscribe((res: any) => {
          if (res.status === 'Success') {
            this.fileError = '';
            this.sourceSettingsForm.get('fileName')?.patchValue(this.selectedFile?.name);
            this.fileUploadedSuccessfully = true;
            this.toaster.success('File uploaded successfully');
          }
        },
          err => {
            this.fileUploadedSuccessfully = false;
            // this.toaster.error('Error uploading file');
            console.error(err);
          })
      }
    }
  }

  onGeneralSubmit(): void {
    // const regionCookie = this.sharedService.getCookie('region');
    const regionCookie = localStorage.getItem('region');
    if (this.generalSettingsForm.invalid) {
      this.generalSettingsForm.markAllAsTouched();
      return;
    }
    const formValue = this.generalSettingsForm.value;
    //const typeValue = this.sourceSettingsForm.getRawValue().type;
    // if (typeValue === "zip" && !this.fileUploadedSuccessfully) {
    //   this.toaster.error('Please upload the ZIP file before saving changes.');
    //   return;
    // }
    const sourceFormValue = this.sourceSettingsForm.getRawValue();
    const fileName = sourceFormValue.fileName?.trim();
    const buildChanged = formValue.buildCommand?.trim() !== this.originalCommands.buildCommand?.trim();
    const installChanged = formValue.installCommand?.trim() !== this.originalCommands.installCommand?.trim();
    const startChanged = formValue.startCommand?.trim() !== this.originalCommands.startCommand?.trim();
    const fileNameChanged = fileName !== this.originalCommands.zip_file_name?.trim();

    const stageToExecute = buildChanged || installChanged || startChanged || fileNameChanged ? 'BuildDeploy' : 'Deploy';

    const ephemeralStorage = formValue.ephemeralStorage ? `${formValue.ephemeralStorage}Gi` : null;
    const req = {
      name: 'sample-website-1',
      environmentId: JSON.parse(localStorage.getItem('environment') || '{}').id,
      sourceCode: {
        type: sourceFormValue.type,
        gitUrl: sourceFormValue.repoUrl,
        s3FileKey: sourceFormValue.type === 'zip' ? fileName : null,
      },
      application: {
        replicas: formValue.replicas,
        instanceType: formValue.instanceType,
        installCommand: formValue.installCommand,
        buildCommand: formValue.buildCommand,
        startCommand: formValue.startCommand,
        ephemeralStorage: ephemeralStorage,
        storage: formValue.storage,
      },
      network: {
        healthEndpoint: formValue.healthEndpoint,
        port: formValue.port,
        isCustomDns: this.showCustomDnsHost,
        customDomain: this.customDnsHost?.value || null,
        appIngressDomain: this.ingressDomain

      },
      config: {
        path: this.deploymentdetails?.config?.path || null,
        name: this.deploymentdetails?.config?.filename || null,
        data: this.deploymentdetails?.config?.data || null
      },
      secret: this.deploymentdetails?.secret || {},
      environment: this.deploymentdetails?.environment || {},
    }
    this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.toaster.success(res.message);
        this.originalCommands.buildCommand = res.data.build_command;
        this.originalCommands.installCommand = res.data.install_command;
        this.originalCommands.startCommand = res.data.start_command;
        this.originalCommands.zip_file_name = res.data.zip_file_name;
        // this.generalSettingsForm.markAsPristine();
        // this.generalSettingsForm.markAsUntouched();
        this.isGeneralSettingsChanged = false;
        this.isSourceSettingsChanged = false;
      }
    },
      err => {
        // this.toaster.error('Error updating general settings in deployment');
        console.error(err);
        // this.generalSettingsForm.markAsPristine();
        // this.generalSettingsForm.markAsUntouched();
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
      if (res.status === "Success") {
        this.toaster.success(res.message);
      }
    },
      err => {
        // this.toaster.error('Error updating source settings in deployment');
        console.error(err);
      });
  }

  // onNetworkingSubmit(): void {
  //   this.isGenerateDomain = false;
  //   // const environment = this.sharedService.getCookie('environment');
  //   const environment = localStorage.getItem('environment');
  //   const envId = environment ? JSON.parse(environment).id : null;
  //   const formValue = this.networkSettingsForm.value
  //   if (!formValue.showAuthentication) delete formValue.authentication;
  //   delete formValue.showAuthentication;
  //   delete formValue.host;
  //   if (!formValue.customDns) delete formValue.customDnsHost;

  //   this.deploymentService.createEndpoint(envId, formValue).subscribe((res: any) => {
  //     if (res && res.status.toLowerCase() === 'success') {
  //       if (res.data?.customDomain) {
  //         this.showCustomDnsHost = true;
  //       } else {
  //         this.ingressDomain = res.data?.domain;
  //       }
  //       this.toaster.success(res.message);
  //       this.fetchCustomDnsHost();
  //       // this.confirmationModel.close();
  //     } else {
  //       this.showCustomDnsHost = false;
  //       this.closeModal()
  //     }

  //   })
  // }

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
      if (res.status === "Success") {
        this.toaster.success(res.message);
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
            if (res.status === "Success") {
              this.toaster.success(res.message);
              //this.route.navigate(['/deployment']);
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

  // toggleAuthentication(event: Event): void {
  //   this.showAuthentication = (event.target as HTMLInputElement).checked;
  //   this.networkSettingsForm.get('showAuthentication')?.setValue(this.showAuthentication);
  //   this.updateAuthenticationValidation();
  // }
  // private updateAuthenticationValidation(): void {
  //   const authGroup = this.authentication;

  //   if (this.showAuthentication) {
  //     authGroup.get('username')?.setValidators(Validators.required);
  //     authGroup.get('password')?.setValidators(Validators.required);
  //   } else {
  //     authGroup.get('username')?.clearValidators();
  //     authGroup.get('password')?.clearValidators();
  //   }
  //   authGroup.get('username')?.updateValueAndValidity();
  //   authGroup.get('password')?.updateValueAndValidity();
  // }
  // get authentication(): FormGroup {
  //   return this.networkSettingsForm.get('authentication') as FormGroup;
  // }
  // isInvalid(controlName: string): boolean {
  //   const control = this.networkSettingsForm.get(controlName);
  //   return control ? control.invalid && (control.dirty || control.touched) : false;
  // }
  // toggleVisibility(): void {
  //   this.hide = !this.hide;
  // }

  // toggleHost(event: Event): void {
  //   this.isHostDisabled = !(event.target as HTMLInputElement).checked;
  //   const hostControl = this.networkSettingsForm.get('host');
  //   if (this.isHostDisabled) {
  //     hostControl?.disable();
  //     this.customDnsHost?.setValue('')
  //     this.networkSettingsForm.get('customDnsHost')?.setValue('')
  //     this.onNetworkingSubmit()
  //   } else {
  //     hostControl?.enable();
  //   }
  // }

  // fetchCustomDnsHost() {
  //   // const environment = this.sharedService.getCookie('environment');
  //   const environment = localStorage.getItem('environment');
  //   const envId = environment ? JSON.parse(environment).id : null;
  //   this.deploymentService.getAuthenticatedresponse(envId, this.deploymentId).subscribe((res: any) => {
  //     this.showAuthenticationData = res.data;
  //     this.endpointStatus = res.data?.status;
  //     const customDomain = res.data.customDomain || '';
  //     const authentication = this.showAuthenticationData?.authentication || null;

  //     if (customDomain) { this.isHostDisabled = true; }
  //     this.customDnsHost.setValue(customDomain);

  //     if (authentication) {
  //       this.networkSettingsForm.get('showAuthentication')?.setValue(true);
  //     }

  //     const authGroup = this.networkSettingsForm.get('authentication') as FormGroup;
  //     if (authGroup && authentication.username && authentication.password) {
  //       authGroup.patchValue({
  //         username: authentication.username,
  //         password: authentication.password
  //       });
  //     }
  //   });
  // }

  // closeModal() {
  //   this.networkSettingsForm.get('customDns')?.setValue(false)
  //   this.customDnsHost?.setValue('');
  //   this.networkSettingsForm.get('customDnsHost')?.setValue('');
  //   this.showCustomDnsHost = false;
  //   // this.confirmationModel.close()
  // }

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

  // shouldEnableButtons(): boolean {
  //   const auth = this.networkSettingsForm.get('showAuthentication')?.value;
  //   const dns = this.networkSettingsForm.get('customDns')?.value;
  //   return !!auth || !!dns;
  // }

  // deleteEndpoint(){
  //   const modalRef = this.modalService.open(ConfirmationModalComponent);
  //   modalRef.componentInstance.selectedItem = 'Endpoint';
  //   modalRef.componentInstance.message = 'Are you sure you want to delete this endpoint?';

  //   modalRef.result.then(
  //     (result) => {
  //       if (result) {
  //         // const environment = this.sharedService.getCookie('environment');
  //         const environment = localStorage.getItem('environment');
  //         const envId = environment ? JSON.parse(environment).id : null;
  //         this.deploymentService.deleteEndpoint(envId, this.deploymentdetails?.name).subscribe((res: any) => {
  //           if (res.status === "Success") {
  //             this.toaster.success(res.message);
  //             this.ingressDomain ='';
  //             // this.fetchCustomDnsHost();
  //           }
  //         });
  //       } else {
  //         console.log('Cancelled delete endpoint!');
  //       }
  //     });
  // }

  Port() {
    const portControl = this.generalSettingsForm.get('port');
    if (portControl && portControl.value === '') {
      portControl.setValue(null, { emitEvent: false });
    }
  }
}