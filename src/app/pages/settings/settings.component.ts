import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  CardBodyComponent, CardComponent, CardGroupComponent, NavComponent, NavItemComponent, NavLinkDirective, TabContentRefDirective, TabContentComponent, RoundedDirective, TabPaneComponent,
  FormControlDirective, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
} from '@coreui/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ResourceQuotaComponent } from './resource-quota/resource-quota.component';
import { ServiceQuotaComponent } from './service-quota/service-quota.component';
import { ObservabilityLoggingComponent } from './observability-logging/observability-logging.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../shared/services/shared.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { ProjectsService } from '../projects/projects.service';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../shared/components/model/model.component';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SettingsService } from './settings.service';
import { DeploymentsService } from '../deployments/deployment.service';
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CardGroupComponent, CardComponent, CardBodyComponent, NavComponent, NavItemComponent, NavLinkDirective,
    TabContentRefDirective, TabContentComponent, TabPaneComponent, FormControlDirective, ModalComponent,
    FormCheckInputDirective, FormCheckLabelDirective, FormDirective, FormCheckComponent, ReactiveFormsModule, RouterLink,
    ResourceQuotaComponent, ServiceQuotaComponent, ObservabilityLoggingComponent, LoaderComponent, CommonModule, ConfirmationModalComponent, FormsModule],
  providers: [ProjectsService, SettingsService, DeploymentsService],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {

  activeTab: string = 'general';
  nameValidation: string = "Name must be alphanumeric & may contain hyphen. No special characters allowed.";
  generalProjectForm !: FormGroup;
  environmentForm !: FormGroup;
  environments: any;
  private subscription: Subscription = new Subscription();

  deployments: any = [];
  projectName: string = '';
  projectId: string = '';
  envId: string = '';

  @ViewChild('editEnvironmentsModel') private editEnvironmentsModel!: ModalComponent;

  public editEnvironmentsModelConfig: any = {
    modalTitle: 'Edit environment',
    width: '500px',
    height: '1500px',
    hideDismissButton: () => true,
    hideCloseButton: () => true
  };
  hasEnvVar: boolean = false;

  constructor(private fb: FormBuilder, private shared: SharedService, private modalService: NgbModal, private projectService: ProjectsService,
    private toastr: ToastrService, private http: SettingsService, private router: Router, private deploymentService: DeploymentsService
  ) {
    //const storedValue = this.shared.getCookie('project');
    const storedValue = localStorage.getItem('project');
    if (storedValue) {
      this.projectName = JSON.parse(storedValue).name;
      this.projectId = JSON.parse(storedValue).id;
    }
    // const env = this.shared.getCookie('environment');
    const env = localStorage.getItem('environment');
    if (env) {
      this.envId = JSON.parse(env).id;
    }
  }

  ngOnInit(): void {
    this.generalProjectForm = this.fb.group({
      projectName: ['', this.shared.isValidName()],
      description: ['']
    });

    this.environmentForm = this.fb.group({
      envName: ['', this.shared.isValidName()]
    });
    this.getProjectDetails();
    this.getEnvironments();
    this.getDeploymentsByProject();

    this.subscription = this.shared.projectValueChange$.subscribe((value: any) => {
      this.projectId = value.id;
      this.projectName = value.name;

      this.getProjectDetails();
      this.getEnvironments();
      this.getDeploymentsByProject();
    });
  }

  getProjectDetails() {
    this.projectService.getProjectDetailsById(this.projectId).subscribe((res: any) => {
      if (res.status === "Success") {
        this.generalProjectForm.get('projectName')?.setValue(res.data.name);
        this.generalProjectForm.get('description')?.setValue(res.data.description);
      }
    });
  }

  getEnvironments(): void {
    this.projectService.getEnvironmentsByProject(this.projectId).subscribe((res: any) => {
      this.environments = res.data;
      this.hasEnvVar = this.environments.length > 0;
    },
      err => {
        this.hasEnvVar = false;
      })
  }

  getDeploymentsByProject(): void {
    this.deploymentService.getDeployments(this.envId).subscribe((res: any) => {
      if (res.status === "Success") {
        this.deployments = res.data;
      }
    });
  }

  onOptionSelected(event: Event, env: any): void {
    const moreOptions = event.target as HTMLSelectElement;
    const selectedValue = moreOptions.value;
    this.onActionSelected(selectedValue, env);
    if (selectedValue !== "three-dots") {
      moreOptions.options[0].text = '⋮';
      moreOptions.value = "three-dots";
    }
  }

  onActionSelected(action: any, env: any): void {
    switch (action) {
      case 'edit':
        this.editEnvironment(env)
        break;
      case 'delete':
        this.deleteEnvironment(env)
        break;
    }
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
      projectId: this.projectId,
      cpuMaxUserLimit: 5,
      memoryMaxUserLimit: 10,
      ephemeralStorageMaxUserLimit: 15,
      pvcStorageMaxUserLimit: 50
    }
    this.projectService.updateEnvironment(req).subscribe((res: any) => {
      if (res.status === 'Success') {
        this.toastr.success("Updated successfully");
        this.projectService.getEnvironmentsByProject(this.projectId).subscribe((envRes: any) => {
          this.shared.emitEnvDDChange(envRes.data);
          this.environments = envRes.data;
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
    console.log("delete environment action");
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.projectService.deleteEnvironment(this.projectId, env.id).subscribe((res: any) => {
            if (res.status === 'Success') {
              this.toastr.success(res.message);
              this.projectService.getEnvironmentsByProject(this.projectId).subscribe((envRes: any) => {
                this.shared.emitEnvDDChange(envRes.data);
              });
              this.router.navigate(['/deployment']);
              console.log('Deleted environment');
            }
          });
        } else {
          console.log('Cancelled delete environment!');
        }
      });
  }

  updateProject(): void {
    if (this.generalProjectForm.value.projectName == "")
      this.generalProjectForm.value.projectName = 'default';
    const req = {
      name: this.generalProjectForm.value.projectName,
      description: this.generalProjectForm.value.description
    }
    this.projectService.updateProject(this.projectId, req).subscribe((res: any) => {
      if (res.status == 'success') {
        this.toastr.success(res.message);
      }
    });
  }

  deleteProject(): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Project';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.projectService.deleteProject(this.projectId).subscribe((res: any) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.projectService.getAllProjects().subscribe((projectRes: any) => {
                this.shared.emitProjectDDChange(projectRes.data);
              });
              this.router.navigate(['/deployment']);
              console.log('Confirmed delete project!');
            }
          });
        } else {
          console.log('Cancelled delete project!');
        }
      });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

}
