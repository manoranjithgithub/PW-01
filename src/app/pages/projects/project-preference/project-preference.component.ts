import { Component, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  AccordionButtonDirective,
  AccordionComponent,
  AccordionItemComponent,
  TemplateIdDirective,
  CalloutComponent,
  DropdownComponent,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
} from '@coreui/angular';
import { currentUsageFields, estimatedUsageFields } from '../../../core/constants/usage.fields.constants';
import { userList } from '../../../core//constants/user-list.constants'
import { Integrations } from '../../../core/constants/integrations.constant';
import { Preferencedata } from '../../../core/constants/preference-data.constant';
import { ProjectsService } from '../projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { SharedService } from '../../../shared/services/shared.service';
import { DeploymentsService } from '../../../shared/services/deployments.service';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-project-preference',
  standalone: true,
  imports: [RouterModule, AccordionButtonDirective, AccordionComponent, AccordionItemComponent, TemplateIdDirective,
    CalloutComponent, CommonModule, FormsModule, DropdownComponent, DropdownItemDirective, DropdownMenuDirective,
    DropdownToggleDirective, ReactiveFormsModule, ConfirmationModalComponent, ModalComponent
  ],
  providers: [ProjectsService, DeploymentsService],
  templateUrl: './project-preference.component.html',
  styleUrl: './project-preference.component.scss',
  encapsulation: ViewEncapsulation.None
})

export class ProjectPreferenceComponent implements OnInit, OnDestroy {

  projectDetails: any = '';
  projectNamenew: any = '';
  currentProjectId: any = '';
  projectDescriptionnew: any = '';
  projectEnvNames: any = '';

  envId: any = '';
  nameValidation: string = "Name must be alphanumeric & may contain hyphen. No special characters allowed.";

  generalSettingForm!: FormGroup;
  emailIDForm!: FormGroup;
  usageForm!: FormGroup;
  preferencesForm!: FormGroup;
  userForm!: FormGroup;
  environmentForm !: FormGroup;

  isGeneralEditMode = false;
  showAddUserForm = false;
  activeEnv: any = null;

  currentUsageFields = currentUsageFields;
  estimatedUsageFields = estimatedUsageFields;
  userList = userList;
  integrations = Integrations;
  environments = [{ id: '', name: '', resourceLimit: '', region: '' }];
  preferenceData = Preferencedata;
  newUser = { name: '', email: '' };

  currentUsageData: any = [];

  estimatedUsageData: any = [];

  get currentUsageTotal(): string {
    const total = this.currentUsageData.reduce((sum: number, item: any) => {
      const cost = Number(item.totalCost ?? 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    return total === 0 ? '0' : total.toFixed(2);
  }

  get estimatedUsageTotal() {
    const total = this.estimatedUsageData.reduce((sum: number, item: any) => {
      const cost = Number(item.totalCost ?? 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    return total === 0 ? '0' : total.toFixed(4);
  }

  @ViewChild('editEnvironmentsModel') private editEnvironmentsModel!: ModalComponent;

  public editEnvironmentsModelConfig: any = {
    modalTitle: 'Edit environment',
    width: '500px',
    height: '1500px',
    hideDismissButton: () => true,
    hideCloseButton: () => true
  };

  private destroy$ = new Subject<void>();
  isDropdownOpen: { [key: number]: boolean } = {};
  isBusiness: boolean = false;


  constructor(private fb: FormBuilder, private projectService: ProjectsService, private route: ActivatedRoute,
    private shared: SharedService, private deploymentsService: DeploymentsService,
    private toastr: ToastrService, private modalService: NgbModal, private router: Router,
    private layoutActionService: LayoutActionService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentProjectId = params['projectId'];
    });
    this.shared.user$.subscribe((user: any) => {
      this.isBusiness = user?.owner !== 'nimbuz';
    });
    this.projectService.getProjectDetailsById(this.currentProjectId).subscribe((res: any) => {
      if (res.status === "Success") {
        this.updateIntegrationStatus('github', res.data.github);
        this.updateIntegrationStatus('gitlab', res.data.gitlab);
        // this.checkIntegrationStatus('github');
        // this.checkIntegrationStatus('gitlab');
        this.projectDetails = res.data;
        this.layoutActionService.setExtraTitle(this.projectDetails.name);
        // this.projectEnvNames = (this.projectDetails.environments || []).map((env: any) => env.name);
        this.projectService.getAllEnvironmentsByProject(this.currentProjectId).subscribe((envRes: any) => {
          this.shared.emitEnvDDChange(envRes.data);
          this.projectEnvNames = (envRes.data || []).map((env: any) => ({
            name: env.name,
            id: env.id,
            region: env.region
          }));
          this.updateEnvironments();
        });
        // this.projectEnvNames = (this.projectDetails.environments || []).map((env: any) => ({
        //   name: env.name,
        //   id: env.id,
        //   region: env.region
        // }));
        // this.updateEnvironments();
      }

      this.generalSettingForm = this.fb.group({
        projectName: [this.projectDetails.name, Validators.maxLength(40)],
        projectId: [this.projectDetails.id],
        description: [this.projectDetails.description],
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

    this.environmentForm = this.fb.group({
      envName: ['', this.shared.isValidName()]
    });
    // this.checkIntegrationStatus('GitHub');
    // this.checkIntegrationStatus('GitLab');
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const req = {
      fromTimestamp: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString(),
      toTimestamp: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString(),
      userId: localStorage.getItem('userId')
    };
    // if (req) {
    //   this.projectService.getUsageCost(req).subscribe((res: any) => {
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
    //         costFormatted: `$${cost.toFixed(4)}`
    //       };
    //     });
    //   })
    // }

    this.layoutActionService.actionClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onLayoutButtonClick();
      });
  }
  updateIntegrationStatus(name: string, isConnected: boolean) {
    const integration = this.integrations.find(i => i.provider === name.toLowerCase());
    if (integration) {
      integration.status = isConnected ? 'connected' : 'not connected';
    }
  }
  checkIntegrationStatus(provider: string) {
    this.deploymentsService.getIntegrationStatus(this.currentProjectId, provider.toLowerCase()).subscribe((data: any) => {
      const isConnected = data && data.status === 'Success' && Object.keys(data.data).length > 0;
      this.updateIntegrationStatus(provider, isConnected);
    });
  }
  updateEnvironments() {
    const envCount = this.projectEnvNames.length;
    this.mapEnvironments(this.projectEnvNames)
    this.environments = this.mapEnvironments(this.projectEnvNames)
  }

  onOptionSelected(event: Event, env: any): void {
    const moreOptions = event.target as HTMLSelectElement;
    const selectedValue = moreOptions.value;
    this.onActionSelected(selectedValue, env);

  }

  onActionSelected(action: any, env: any): void {
    switch (action) {
      case 'view':
        this.viewEnvironment(env)
        break;
      case 'edit':
        this.editEnvironment(env)
        break;
      case 'delete':
        this.deleteEnvironment(env)
        break;
    }
  }

  viewEnvironment(env: any): void {
    this.router.navigate(['/environment-preferences'], {
      queryParams: {
        envName: env.name,
        region: env.region,
        envId: env.id,
        projectId: this.currentProjectId
      }
    });
  }

  editEnvironment(env: any): void {
    this.envId = env.id;
    this.environmentForm.patchValue({
      envName: env.name
    });
    this.editEnvironmentsModel.open();
  }

  updateEnvironment(): void {
    const req = {
      name: this.environmentForm.get('envName')?.value,
      id: this.envId,
      projectId: this.currentProjectId,
      cpuMaxUserLimit: 5,
      memoryMaxUserLimit: 10,
      ephemeralStorageMaxUserLimit: 15,
      pvcStorageMaxUserLimit: 50
    }
    this.projectService.updateEnvironment(req).subscribe((res: any) => {
      if (res.status === 'Success') {
        this.toastr.success("Updated successfully");
        this.projectService.getEnvironmentsByProject(this.currentProjectId).subscribe((envRes: any) => {
          this.shared.emitEnvDDChange(envRes.data);
          this.environments = this.mapEnvironments(envRes.data);
        });
      }
    },
      err => {
        console.error("Updated failed");
      });
    this.editEnvironmentsModel.close();
  }



  closeModal(): void {
    this.editEnvironmentsModel.close();
  }

  deleteEnvironment(env: any): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'environment';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.projectService.deleteEnvironment(this.currentProjectId, env.id).subscribe((res: any) => {
            if (res.status.toLowerCase() === 'success') {
              this.toastr.success(res.message);
              this.projectService.getEnvironmentsByProject(this.currentProjectId).subscribe((envRes: any) => {
                this.shared.emitEnvDDChange(envRes.data);
                this.environments = this.mapEnvironments(envRes.data);
              });
              // this.router.navigate(['/projects']);
              console.log('Deleted environment');
            }
          });
        } else {
          console.log('Cancelled delete environment!');
        }
      });
  }

  private mapEnvironments(envData: any[]): any[] {
    // const resourceUsage = JSON.parse(this.shared.getCookie('resourceUsage'));
    const resourceUsage = localStorage.getItem('resourceUsage') ? JSON.parse(localStorage.getItem('resourceUsage') || '{}') : [];
    const cpuResource = resourceUsage.find(
      (res: any) => res.resource_type === 'CPU'
    );
    const ramResource = resourceUsage.find(
      (res: any) => res.resource_type === 'RAM'
    );
    const ephemeralResource = resourceUsage.find(
      (res: any) => res.resource_type === 'ephemeral_storage'
    );
    return envData.map((env: any) => ({
      id: env.id,
      name: env.name,
      resourceLimit: `<span class="limits">CPU :</span>  ${env?.cpuMaxPlatformLimit} (${cpuResource?.unit})  <span class="limits">Memory :</span> ${env?.memoryMaxPlatformLimit} (${ramResource?.unit.toUpperCase()})  <span class="limits">Storage :</span> ${env?.ephemeralStorageMaxPlatformLimit} (${ephemeralResource?.unit.toUpperCase()})`,
      region: env.region,
    }));
  }


  saveGeneralChanges() {
    const { projectName, description } = this.generalSettingForm.value;

    const reqBody = {
      "name": projectName,
      "description": description ?? ""
    };

    this.projectService.updateProject(this.currentProjectId, reqBody).subscribe((res: any) => {
      if (res.status === 'Success') {
        this.toastr.success('Updated Successfully');
        this.layoutActionService.setExtraTitle(projectName);
      } else {
        this.toastr.error(res.message);
      }
    });
    this.isGeneralEditMode = false;
  }

  toggleGeneralEditMode() {
    this.isGeneralEditMode = !this.isGeneralEditMode;
  }

  toggleAddUserForm() {
    this.showAddUserForm = !this.showAddUserForm;
  }

  get projectNameControl(): FormControl {
    return this.generalSettingForm.get('projectName') as FormControl;
  }

  get projectIdControl(): FormControl {
    return this.generalSettingForm.get('projectId') as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.generalSettingForm.get('description') as FormControl;
  }

  saveChanges() {
    this.isGeneralEditMode = false;
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
  toggleDropdown(env: any, event: MouseEvent): void {
    // event.stopPropagation();
    this.activeEnv = this.activeEnv === env ? null : env;
  }
  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.activeEnv = null;
    }
  }
  diconnectProfile(provider: string) {
    if (provider) {

      const modalRef = this.modalService.open(ConfirmationModalComponent);
      modalRef.componentInstance.selectedItem = 'disconnect';
      modalRef.componentInstance.message = 'Are you sure you want to proceed?';

      modalRef.result.then(
        (result) => {
          if (result) {
            this.deploymentsService.disconnectProfile(this.currentProjectId, provider.toLowerCase()).subscribe({
              next: (res: any) => {
                this.updateIntegrationStatus(provider, false);
              },
              error: (err) => {
                console.error(`Error disconnecting ${provider} profile`, err);
              }
            });
          } else {
            console.log('Cancelled!');
          }
        });


    }
  }
  connectProfile(provider: 'github' | 'gitlab') {
    if (provider) {
      const { clientId = '', redirectUri = '' } = environment[provider] || {};
      const state = {
        state: this.getState(),
        provider: provider
      }
      const scope = provider === 'gitlab' ? 'api' : 'repo,user,email';
      const baseUrl =
        provider === 'github'
          ? 'https://github.com/login/oauth/authorize'
          : 'https://gitlab.com/oauth/authorize';
      const authUrl = `${baseUrl}?client_id=${clientId}&redirect_uri=${redirectUri}` +
        `&response_type=code&state=${btoa(JSON.stringify(state))}&scope=${encodeURIComponent(scope)}`;
      window.location.href = authUrl;
      this.updateIntegrationStatus(provider, true);
      // this.deploymentsService.integrateWithVCS(provider.toLowerCase()).subscribe({
      //   next: (res: any) => {
      //     if (res) {
      //       const githubAuthUrl = res?.authUrl;
      //       window.location.href = githubAuthUrl;
      //       this.updateIntegrationStatus(provider, true);
      //     }
      //   },
      //   error: (err) => {
      //     console.error(`Error connecting to ${provider}`, err);
      //   }
      // });
    }
  }
  onLayoutButtonClick() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Project';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.projectService.deleteProject(this.currentProjectId).subscribe((res: any) => {
            if (res.status === 'Success') {
              //this.shared.setCookie('resourceUsage', '', 10);
              localStorage.removeItem('resourceUsage');
              this.toastr.success(res.message);
              this.router.navigate(['/projects']);
            }
          });
        } else {
          console.log('Cancelled delete environment!');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.layoutActionService.clearExtraTitle();
  }

  toggleDropdownOption(index: number) {
    this.isDropdownOpen[index] = !this.isDropdownOpen[index];
  }

  deleteAccess(user: any) {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Access';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.userList = this.userList.filter(x => x.email !== user.email);
          this.toastr.success('Access revoked successfully')
        } else {
          console.log('Cancelled !');
        }
      });
  }

  getState(): string {
    const subdomain = this.getSubdomain();
    const isIndividual = subdomain === 'app';
    return isIndividual ? 'nimbuz' : subdomain;
  }

  private getSubdomain(): string {
    const hostname = window.location.hostname;
    return hostname.split('.')[0];
  }

  getProfile(provider: string) {
    if (provider === 'github' || provider === 'gitlab') {
      this.connectProfile(provider);
    } else {
      console.error('Invalid provider:', provider);
    }
  }
}