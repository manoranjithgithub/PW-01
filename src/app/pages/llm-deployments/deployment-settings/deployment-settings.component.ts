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
import { CommonModule, ViewportScroller } from '@angular/common';
import { SharedService } from '../../../shared/services/shared.service';
import { PermissionService } from '../../../shared/services/permission.service';
import { ToastrService } from 'ngx-toastr';
import { DEPLOYMENT_TYPES } from '../../../shared/constants/nimbuz.constant';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { concatMap, tap } from 'rxjs';
import { DeploymentsService } from '../../deployments/deployment.service';
import { LLMDeploymentsService } from '../llm-deployment.service';
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
  providers: [LLMDeploymentsService],
  encapsulation: ViewEncapsulation.None
})
export class DeploymentSettingsComponent implements OnInit, AfterViewInit {
  domainValue = '3.15.124.155';


  @Output() closeModalEvent = new EventEmitter<void>();
  generalSettingsForm !: FormGroup;
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
  envId: string = '';
  constructor(private fb: FormBuilder, private sharedService: SharedService, private deploymentService: LLMDeploymentsService,
    private toaster: ToastrService, private modalService: NgbModal, private route: Router, private ac: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    public permissionService: PermissionService) { }

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
    this.envId = environment ? JSON.parse(environment).id : null;

    this.ac.queryParams.subscribe(params => {
      this.deploymentId = params['id'];
      if (!this.deploymentId) {
        this.toaster.error('Deployment ID is missing in the URL');
        return;
      }
    });

    this.generalSettingsForm = this.fb.group({
      storage: [null, Validators.pattern("^[0-9]+$")],
      name: ['', [Validators.required]],
      modelId: ['', Validators.required],
      replicas: [1, [Validators.required]],
      instanceType: ['Nvidia L2', Validators.required],
      contextLength: [512, [Validators.required]],
      storageSize: [10, [Validators.required]],
      ephemeralStorageSize: [10, [Validators.required]],
      environmentId: [''],
    })
    this.ac.queryParams.subscribe(params => {
      const deploymentId = params['id'];
      this.deploymentService.getDeploymentById(deploymentId, this.envId).subscribe((res: any) => {
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

    //   const authGroup = this.networkSettingsForm?.get('authentication') as FormGroup;
    //   if (authGroup && authentication.username && authentication.password) {
    //     authGroup.patchValue({
    //       username: authentication.username,
    //       password: authentication.password
    //     });
    //   }
    // });


  }



  getDeploymentById(): void {

    this.deploymentService.getDeploymentById(this.deploymentdetails?.name, this.envId).subscribe((res: any) => {
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
        this.generalSettingsForm.patchValue(res.data);

        const initialValues = this.generalSettingsForm.value;

        this.generalSettingsForm.valueChanges.subscribe(currentValues => {
          this.isGeneralSettingsChanged = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
        });
        if (res.data.sourceCode?.type.toLowerCase() === "file") {
          this.s3FileKey = res.data.sourceCode?.s3FileKey;
        }
        this.generalcurrentValues = this.generalSettingsForm.value;
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

  onGeneralSubmit(): void {
    if (this.generalSettingsForm.invalid) {
      this.generalSettingsForm.markAllAsTouched();
      return;
    }
    const formValue = this.generalSettingsForm.getRawValue();
    const originalApp = { ...(this.deploymentdetails?.application || {}), ...(this.deploymentdetails?.buildConfig || {}) };

    const application = this.getChangedFields({
      replicas: formValue.replicas,
      instanceType: formValue.instanceType,
      storage: formValue.storage,
    }, originalApp);
    const nameChanged = this.getChangedFields({ name: formValue.name }, { name: this.deploymentdetails?.name });

    const req: any = {};
    if (Object.keys(nameChanged).length) req.name = nameChanged.name;
    if (Object.keys(application).length) req.application = application;
    this.deploymentService.updateDeployment(this.deploymentdetails?.id, req).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.toaster.success('Updated successfully');
        this.generalSettingsForm.patchValue({
          llmId: res.data.name,
          instanceType: res.data.application?.instanceType,
          replicas: res.data.application?.replicas,
          storage: res.data.application?.storage,
        });
        this.isGeneralSettingsChanged = false;
        this.isSourceSettingsChanged = false;
      }
    },
      err => {
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
              window.location.href = '/llm/list'
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
  isError(controlName: string, errorType: string): boolean {
    const control = this.generalSettingsForm.controls[controlName];
    return control.hasError(errorType) && control.touched;
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
}