/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Component, ViewChild, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownComponent } from '@coreui/angular';
import { ModalComponent } from '../../model/model.component';
import { ListItem } from '../../../../core/models/list-item.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ProjectsService } from '../../../../pages/projects/projects.service';
import { DeploymentsService } from '../../../services/deployments.service';
import { SharedService } from '../../../services/shared.service';

interface RegionGroup {
  name: string;
  environments: any[];
}
@Component({
  selector: 'app-switch-project',
  standalone: true,
  imports: [
    ModalComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownComponent
  ],
  templateUrl: './switch-project.component.html',
  styleUrl: './switch-project.component.scss',
  providers: [DeploymentsService, ProjectsService],
  encapsulation: ViewEncapsulation.None
})
export class SwitchProjectComponent implements OnInit {
  @ViewChild('showEnvironmentModel') private showEnvironmentModel!: ModalComponent;
  showSwitchProject = false;
  form!: FormGroup;
  projectId = '';
  selectedProject: string = '';
  selectedRegion = '';
  selectedEnvironment = '';

  listOfProjects: ListItem[] = [];
  listOfRegions: RegionGroup[] = [];
  listOfenvironments: ListItem[] = [];

  showEnvironmentConfig = {
    modalTitle: 'Switch project and environment',
    width: '800px',
    height: 'auto',
    hideDismissButton: () => false,
    hideCloseButton: () => false
  };
  private projectSubscription?: Subscription;
  private envSubscription?: Subscription;

  selectedEnvironmentObj: any;

  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
    private projectService: ProjectsService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      project: [''],
      region: ['']
    });
  }

  ngOnInit(): void {
    this.getBasicInfo();

    this.projectSubscription = this.sharedService.projectDDChange$.subscribe((projects: any[]) => {
      this.listOfProjects = projects || [];
      this.getSelectedProject(projects[0]);
    });

    this.envSubscription = this.sharedService.envDDChange$.subscribe((envs: any[]) => {
      this.listOfenvironments = envs || [];
      this.getSelectedEnv(envs[0]);
    });

    this.form.get('project')?.valueChanges.subscribe(val => this.getSelectedProject(val));
    this.form.get('region')?.valueChanges.subscribe(val => this.getSelectedRegion(val));
  }


  private getBasicInfo(): void {
    const { project, region, environment } = this.getSavedSelections();
    this.showSwitchProject = !!(project && region && environment);
    this.projectService.getAllProjects().subscribe((res: any) => {
      this.listOfProjects = res?.data || [];
      const projectFromCookie = this.listOfProjects.find(p => p.name === project?.name);
      this.selectedProject = projectFromCookie?.name || this.listOfProjects[0]?.name;
      if (region) { this.selectedRegion = region }
      if (environment) { this.selectedEnvironment = environment?.name; }
      this.getSelectedProject(projectFromCookie || this.listOfProjects[0]);
    });
  }

  private getRegionsAndEnvironment(): void {
    const { region } = this.getSavedSelections();
    if (!this.projectId) return;
    this.projectService.getAllEnvironmentsByProject(this.projectId).subscribe((res: any) => {
      this.listOfenvironments = res?.data || [];
      this.listOfRegions = [{
        name: 'ap-south-1',
        environments: this.listOfenvironments.filter((env: any) => env.region === 'ap-south-1')
      }];
      const regionFromCookie = this.listOfRegions.find((r: any) => r.name === region);
      this.getSelectedRegion(regionFromCookie || this.listOfRegions[0]);
    });
  }

  getSelectedProject(project: any): void {
    if (!project) return;
    this.projectId = project.id;
    this.form.get('project')?.setValue(project, { emitEvent: false });
    this.getRegionsAndEnvironment();
  }

  getSelectedRegion(data: any): void {
    const { environment } = this.getSavedSelections();
    if (!data) return;
    this.selectedRegion = data.name;
    this.form.get('region')?.setValue(data, { emitEvent: false });
    this.getSelectedEnv(environment);
  }

  getSelectedEnv(env: any): void {
    if (!env) return;
    this.selectedEnvironmentObj = env;
    this.selectedEnvironment = this.selectedEnvironmentObj?.name;

  }
  showEnvironment(): void {
    this.showEnvironmentModel.open();
  }

  closeModal(): void {
    this.getBasicInfo();

    this.showEnvironmentModel.close();
  }

  updateEnvSelection(): void {
    this.selectedProject = this.form.value.project?.name;
    localStorage.setItem('project', JSON.stringify(this.form.value.project));
    this.sharedService.emitProjectValueChange(this.form.value.project);
    this.selectedEnvironment = this.selectedEnvironmentObj?.name;
    localStorage.setItem('environment', JSON.stringify(this.selectedEnvironmentObj));
    this.sharedService.emitEnvValueChange(this.selectedEnvironmentObj);
    const projectId = this.form.value.project?.id;
    if (projectId) {
      this.projectService.getProjectDetailsById(projectId).subscribe((res: any) => {
        const vcsProfileInfo = {
          github: res.data.github,
          gitlab: res.data.gitlab
        }
        localStorage.setItem('vcsProfileInfo', JSON.stringify(vcsProfileInfo));
      });
    }
    this.showEnvironmentModel.close();

  }

  isSelectedEnv(item: any): boolean {
    return this.selectedEnvironmentObj?.name === item.name;
  }

  private getSavedSelections() {
    return {
      project: this.safeParse(localStorage.getItem('project')),
      region: localStorage.getItem('region'),
      environment: this.safeParse(localStorage.getItem('environment'))
    };
  }
  private safeParse(value: string | null): any {
    try {
      return value && value !== 'undefined' ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }
}