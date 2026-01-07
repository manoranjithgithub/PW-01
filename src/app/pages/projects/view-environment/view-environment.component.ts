import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ProjectsService } from '../projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import {
  CardGroupComponent, CardComponent, CardBodyComponent, AccordionButtonDirective,
  AccordionComponent,
  AccordionItemComponent,
  TemplateIdDirective,
  TooltipDirective
} from '@coreui/angular';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Preferencedata } from '../../../core/constants/preference-data.constant';
import { Integrations } from '../../../core/constants/integrations.constant';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PermissionService } from '../../../shared/services/permission.service';
import { currentUsageFields, estimatedUsageFields, RegionOptions, userList } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-view-environment',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule, CardGroupComponent, CardComponent, CardBodyComponent,
    AccordionButtonDirective, AccordionComponent, AccordionItemComponent, TemplateIdDirective, TooltipDirective, RouterLink],
  providers: [ProjectsService],
  templateUrl: './view-environment.component.html',
  styleUrl: './view-environment.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None
})
export class ViewEnvironmentComponent implements OnInit, OnDestroy {
  environmentForm!: FormGroup;
  tableTheme = 'ag-theme-alpine';
  isOpen: boolean = false;
  projectName: string = '';
  projectId: string = '';
  envId: string = '';
  regionOptions = RegionOptions;
  envName: string = '';
  region: string = '';

  generalSettingForm!: FormGroup;
  emailIDForm!: FormGroup;
  usageForm!: FormGroup;
  preferencesForm!: FormGroup;
  userForm!: FormGroup;
  resourceQuotaForm !: FormGroup;

  isGeneralEditMode = false;
  isResourceEditMode = false;
  showAddUserForm = false;
  activeEnv: any = null;

  currentUsageFields = currentUsageFields;
  estimatedUsageFields = estimatedUsageFields;
  userList = userList;
  integrations = Integrations;
  environments = [{ name: '', resourceLimit: '', members: 1 }];
  preferenceData = Preferencedata;
  newUser = { name: '', email: '' };

  currentUsageData: any = [];

  estimatedUsageData: any = [];

  get currentUsageTotal(): string {
    const total = this.currentUsageData.reduce((sum: number, item: any) => {
      const cost = parseFloat(item.totalCost ?? 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    return total.toFixed(2);
  }

  get estimatedUsageTotal() {
    const total = this.estimatedUsageData.reduce((sum: number, item: any) => {
      const cost = parseFloat(item.totalCost ?? 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    return total.toFixed(2);
  }
  private destroy$ = new Subject<void>();
  isBusiness: boolean = false;

  resourceQuotas: any[] = [];

  constructor(
    private fb: FormBuilder, private project: ProjectsService, private shared: SharedService,
    private toaster: ToastrService, private router: Router, private route: ActivatedRoute,
    private layoutActionService: LayoutActionService, private modalService: NgbModal,
    public permissionService: PermissionService) {

    //this.tableTheme = this.shared.getCookie('theme');
    this.tableTheme = localStorage.getItem('theme-default') || 'ag-theme-alpine';
    this.isOpen = true;
    //const storedValue = this.shared.getCookie('project');
    const storedValue = localStorage.getItem('project');
    if (storedValue) {
      this.projectName = JSON.parse(storedValue).name;
      this.projectId = JSON.parse(storedValue).id;
    }
    this.resourceQuotas = JSON.parse(localStorage.getItem('resourceUsage') || '[]');
  }

  ngOnInit(): void {

    this.shared.user$.subscribe((user: any) => {
      this.isBusiness = user?.owner !== 'nimbuz';
    });

    this.route.queryParams.subscribe(params => {
      const envName = params['envName'] || 'default';
      const region = params['region'] || this.regionOptions[0].name;
      const envId = params['envId'] || '';
      const projectId = params['projectId'] || '';

      this.envName = envName;
      this.region = region;
      this.envId = envId;
      this.projectId = projectId;

      this.environmentForm = this.fb.group({
        project: [{ value: this.projectName, disabled: true }],
        name: [envName, [this.shared.isValidName(), Validators.maxLength(50)]],
        region: [region]
      });
    });

    this.emailIDForm = this.fb.group({
      rules: this.fb.array([]),
    });
    this.addEmail();

    this.preferencesForm = this.fb.group({
      usage: [this.preferenceData.usage],
      billing: [this.preferenceData.billing],
      deployments: [this.preferenceData.deployments],
      errors: [this.preferenceData.errors]
    });

    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });

    this.resourceQuotaForm = this.fb.group({
      cpuMaxPlatformLimit: [''],
      cpuMaxUserLimit: [''],
      ephemeralStorageMaxPlatformLimit: [''],
      ephemeralStorageMaxUserLimit: [''],
      memoryMaxPlatformLimit: [''],
      memoryMaxUserLimit: [''],
      pvcStorageMaxPlatformLimit: [''],
      pvcStorageMaxUserLimit: [''],
    });

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // const req = {
    //   fromTimestamp: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString(),
    //   toTimestamp: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString(),
    //   userId: localStorage.getItem('userId')
    // };
    // if (req) {
    //   this.project.getUsageCost(req).subscribe((res: any) => {
    //     this.currentUsageData = (res.data?.usage || []).map((item: any) => {
    //       const hours = parseFloat(item.usageHours) || 0;
    //       const cost = parseFloat(item.totalCost) || 0;

    //       return {
    //         ...item,
    //         hoursFormatted: `${hours.toFixed(2)} hours`,
    //         costFormatted: `$${cost.toFixed(2)}`
    //       };
    //     });
    //     this.estimatedUsageData = (res.data?.estimatedUsage || []).map((item: any) => {
    //       const hours = parseFloat(item.usageHours) || 0;
    //       const cost = parseFloat(item.estimatedCost) || 0;

    //       return {
    //         ...item,
    //         hoursFormatted: `${hours.toFixed(2)} hours`,
    //         costFormatted: `$${cost.toFixed(2)}`
    //       };
    //     });
    //   })
    // }
    this.project.getEnvironmentById(this.projectId, this.envId).subscribe((res: any) => {
      if (res.status === 'Success') {
        // this.envName = res.data.name;
        this.layoutActionService.setExtraTitle(res.data.name);
        this.resourceQuotaForm.patchValue(res.data);
        this.resourceQuotaForm.disable();
        // this.getPlanLimits(res.data);
      }
    });

    this.layoutActionService.actionClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onLayoutButtonClick();
      });

    // this.getPlanLimits();
  }

  cancel() {
    this.isOpen = false;
    this.router.navigate(['/project']);
  }
  goBack() {
    this.router.navigate(['/project']);
  }

  saveEnvChanges() {
    this.envName = this.environmentForm.get('name')?.value || '';
    const reqBody = {
      name: this.envName,
      id: this.envId,
      projectId: this.projectId,
      cpuMaxUserLimit: this.resourceQuotaForm.value.cpuMaxUserLimit,
      memoryMaxUserLimit: this.resourceQuotaForm.value.memoryMaxUserLimit,
      ephemeralStorageMaxUserLimit: this.resourceQuotaForm.value.ephemeralStorageMaxUserLimit,
      pvcStorageMaxUserLimit: this.resourceQuotaForm.value.pvcStorageMaxUserLimit
    };
    this.project.updateEnvironment(reqBody).subscribe((res: any) => {
      if (res.status.toLowerCase() === 'success') {
        this.toaster.success(res.message);
      } else {
        this.toaster.success(res.message);
        this.layoutActionService.setExtraTitle(res.data.name);
      }
    });
    this.isGeneralEditMode = false;
  }

  saveResourceChanges() {
    const reqBody = {
      name: this.envName,
      id: this.envId,
      projectId: this.projectId,
      cpuMaxUserLimit: this.resourceQuotaForm.value.cpuMaxUserLimit,
      memoryMaxUserLimit: this.resourceQuotaForm.value.memoryMaxUserLimit,
      ephemeralStorageMaxUserLimit: this.resourceQuotaForm.value.ephemeralStorageMaxUserLimit,
      pvcStorageMaxUserLimit: this.resourceQuotaForm.value.pvcStorageMaxUserLimit
    };
    this.project.updateEnvironment(reqBody).subscribe((res: any) => {
      if (res.status.toLowerCase() === 'success') {
        this.toaster.success('Resource limits updated successfully');
      } else {
        this.toaster.error(res.message);
      }
    });
    this.isResourceEditMode = false;
    this.resourceQuotaForm.disable();
  }

  toggleGeneralEditMode() {
    this.isGeneralEditMode = !this.isGeneralEditMode;
  }

  toggleResourceEditMode() {
    this.isResourceEditMode = !this.isResourceEditMode;

    if (this.isResourceEditMode) {
      this.resourceQuotaForm.enable();
    } else {
      this.resourceQuotaForm.disable();
    }
  }

  toggleAddUserForm() {
    this.showAddUserForm = !this.showAddUserForm;
  }


  get rulesFormArray(): FormArray {
    return this.emailIDForm.get('rules') as FormArray;
  }

  createRule(): FormGroup {
    return this.fb.group({
      emailID: ['', Validators.required]
    });
  }

  addUser() {
    if (this.userForm.valid) {
      this.userList.push({ ...this.userForm.value });
      this.userForm.reset();
      this.showAddUserForm = false;
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  toggleDropdown(env: any) {
    this.activeEnv = this.activeEnv === env ? null : env;
  }

  cancelAddUser() {
    this.userForm.reset();
    this.showAddUserForm = false;
  }

  addEmail(): void {
    this.rulesFormArray.push(this.createRule());
  }

  removeEmail(index: number): void {
    this.rulesFormArray.removeAt(index);
  }

  onLayoutButtonClick() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Environment';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.componentInstance.requireConfirmation = true;
    modalRef.componentInstance.confirmationWord = this.envName || '';
    
    modalRef.result.then(
      (result) => {
        if (result) {
          this.project.deleteEnvironment(this.projectId, this.envId).subscribe((res: any) => {
            if (res.status === 'Success') {
              this.toaster.success(res.message);
              localStorage.removeItem('environment');
              this.router.navigate(['/projects']);
            }
          });
        } else {
          console.log('Cancelled delete environment!');
        }
      });
  }

  // getPlanLimits(data: any) {
  //   this.resourceQuotaForm.get('cpu.current_cpu')?.setValue(cpu.default_limit);
  //     this.resourceQuotaForm.get('cpu.min_cpu')?.setValue(0);
  //     this.resourceQuotaForm.get('cpu.max_cpu')?.setValue(data.cpuMaxPlatformLimit);
  //     this.resourceQuotaForm.get('cpu.unit')?.setValue(cpu.unit);
  //     this.resourceQuotaForm.get('ram.current_ram')?.setValue(ram.default_limit);
  //     this.resourceQuotaForm.get('ram.min_ram')?.setValue(0);
  //     this.resourceQuotaForm.get('ram.max_ram')?.setValue(ram.max_limit);
  //     this.resourceQuotaForm.get('ram.unit')?.setValue(ram.unit);
  //     this.resourceQuotaForm.get('storage.current_storage')?.patchValue(ephemeralStorage.default_limit);
  //     this.resourceQuotaForm.get('storage.min_storage')?.patchValue(0);
  //     this.resourceQuotaForm.get('storage.max_storage')?.patchValue(data.ephemeralStorageMaxPlatformLimit);
  //     this.resourceQuotaForm.get('storage.unit')?.setValue(ephemeralStorage.unit);
  // }

  getUsagePercent(item: any): number {
    return Math.min((item.current_usage / item.max_limit) * 100, 100);
  }

  getBarColor(item: any): string {
    const percent = this.getUsagePercent(item);
    if (percent < 60) return '#198754';
    if (percent < 85) return '#ffc107';
    return '#dc3545';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.layoutActionService.clearExtraTitle();
  }
  cancelGeneralEdit(){
    this.isGeneralEditMode = false;
    this.environmentForm.patchValue({
      name: this.envName,
      region: this.region,
    });
  }

  cancelResourceEdit(){
    this.isResourceEditMode = false;
    this.resourceQuotaForm.disable();
    // Reset form to original values
    this.project.getEnvironmentById(this.projectId, this.envId).subscribe((res: any) => {
      if (res.status === 'Success') {
        this.resourceQuotaForm.patchValue(res.data);
      }
    });
  }
}
