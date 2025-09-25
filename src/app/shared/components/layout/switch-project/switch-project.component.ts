/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Component, ViewChild, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  showSwitchProject = false;
  @ViewChild('showEnvironmentModel') private showEnvironmentModel!: ModalComponent;

  form!: FormGroup;
  projectId = '';
  selectedProject: string = '';
  selectedRegion = '';
  selectedEnvironment = '';
  listOfProjects: ListItem[] = [];
  //listOfRegions: ListItem[] = [];
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
  orgName: string = '';

  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private projectService: ProjectsService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      project: [''],
      region: ['']
    });
  }

  ngOnInit(): void {
    if (this.authService.isTokenReady()) {
      this.getBasicInfo();
    } else {
      this.authService.tokenReady$.subscribe((ready) => {
        if (ready) {
          this.getBasicInfo();
        }
      });
      this.sharedService.user$.subscribe((user: any) => {
        if (user) {
          this.orgName = user.owner;
        }
      });
    }


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
    //const savedProject = this.sharedService.getCookie('project');
    const savedProject = localStorage.getItem('project');
    //const savedRegion = this.sharedService.getCookie('region');
    const savedRegion = localStorage.getItem('region');
    //const savedEnvironment = this.sharedService.getCookie('environment');
    const savedEnvironment = localStorage.getItem('environment');

    this.showSwitchProject = !!(savedProject && savedProject !== 'undefined' &&
      savedRegion && savedRegion !== 'undefined' &&
      savedEnvironment && savedEnvironment !== 'undefined');

    this.projectService.getAllProjects().subscribe((res: any) => {
      this.listOfProjects = res?.data || [];
      const projectFromCookie = this.listOfProjects.find(p => p.name === JSON.parse(savedProject || '{}')?.name);
      this.selectedProject = projectFromCookie?.name || this.listOfProjects[0]?.name;
      if (savedRegion) { this.selectedRegion = savedRegion }
      if (savedEnvironment) { this.selectedEnvironment = JSON.parse(savedEnvironment)?.name; }
      this.getSelectedProject(projectFromCookie || this.listOfProjects[0]);
    });
  }

  private getEnvironment(): void {
    if (!this.projectId) return;

    // const savedEnvironment = this.sharedService.getCookie('environment');
    const savedEnvironment = localStorage.getItem('environment');
    if (!savedEnvironment) {
      return;
    }
    const savedEnvironmentStr = JSON.parse(savedEnvironment);

    if (this.projectId !== savedEnvironmentStr.projectId) {
      this.selectedEnvironment = '';
      this.listOfenvironments = [];
      this.selectedEnvironmentObj = '';
      return;
    }
    // this.projectService.getEnvironmentsByProject(this.projectId).subscribe((res: any) => {
    //   const envs = res?.data || [];
    //   this.listOfenvironments = envs;

    //   const environmentFromCookie = envs.find((env: any) => env.name === JSON.parse(savedEnvironment || '{}')?.name);
    //   this.getSelectedEnv(environmentFromCookie || envs[0]);
    // }, () => {
    //   this.selectedEnvironment = '';
    //   this.listOfenvironments = [];
    // });
  }

  private getRegionsAndEnvironment(): void {
    if (!this.projectId) return;

    const savedRegion = localStorage.getItem('region');

    this.projectService.getProjectDetailsById(this.projectId).subscribe((res: any) => {
      const data = res?.data;
      const environments = data?.environments || [];

      // Group environments by region
      const groupedByRegion = this.groupEnvironmentsByRegion(environments);
      this.listOfRegions = [{
        name: 'ap-south-1',
        environments: groupedByRegion['ap-south-1']
      }];

      // this.listOfRegions = Object.keys(groupedByRegion).map(regionName => ({
      //   name: 'ap-south-1',
      //   environments: groupedByRegion[regionName]
      // }));

      const regionFromCookie = this.listOfRegions.find((r: any) => r.name === savedRegion);
      this.getSelectedRegion(regionFromCookie || this.listOfRegions[0]);
    }, () => this.clearEnvAndRegion());
  }

  private groupEnvironmentsByRegion(environments: any[]): Record<string, any[]> {
    return environments.reduce((acc, env) => {
      const region = env.region;
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(env);
      return acc;
    }, {} as Record<string, any[]>);
  }

  private clearEnvAndRegion(): void {
    this.selectedRegion = '';
    this.listOfRegions = [];
    this.selectedEnvironment = '';
    this.listOfenvironments = [];
  }

  getSelectedProject(project: any): void {
    if (!project) return;
    this.projectId = project.id;
    this.form.get('project')?.setValue(project, { emitEvent: false });
    this.getEnvironment();
    this.getRegionsAndEnvironment();
  }

  getSelectedRegion(region: any): void {
    if (!region) return;
    this.selectedRegion = region.name;
    this.form.get('region')?.setValue(region, { emitEvent: false });
    this.projectService.getAllEnvironmentsByProject(this.projectId ).subscribe((res: any) => {
      this.listOfenvironments =  res?.data || [];
    });
    
    // const savedEnv = this.sharedService.getCookie('environment');
    const savedEnv = localStorage.getItem('environment');
    const parsedEnv = savedEnv ? JSON.parse(savedEnv) : null;
    // const envFromCookie = region.environments.find((env: any) => env.name === parsedEnv?.name);
    this.getSelectedEnv(parsedEnv);
  }

  getSelectedEnv(env: any): void {
    if (!env) return;
    this.selectedEnvironmentObj = env;
    this.selectedEnvironment = this.selectedEnvironmentObj?.name;

    this.getResourceUsage(env.id);
  }

  getResourceUsage(envId: string): void {
    if (!envId || this.orgName !== 'nimbuz') return;
    this.projectService.getResourceUsage(envId).subscribe((res: any) => {
      if (res?.status && res?.data) {
        // this.sharedService.setCookie('resourceUsage', JSON.stringify(res.data), 10);
        localStorage.setItem('resourceUsage', JSON.stringify(res.data));
      }
    });
  }

  showEnvironment(): void {
    this.showEnvironmentModel.open();
  }

  closeModal(): void {
    this.showEnvironmentModel.close();
  }

  updateEnvSelection(): void {
    // const project = ''
    this.selectedProject = this.form.value.project?.name;
    //this.sharedService.setCookie('project', JSON.stringify(this.form.value.project), 10);
    localStorage.setItem('project', JSON.stringify(this.form.value.project));
    this.sharedService.emitProjectValueChange(this.form.value.project);
    // const env = {}
    this.selectedEnvironment = this.selectedEnvironmentObj?.name;
    //this.sharedService.setCookie('environment', JSON.stringify(this.selectedEnvironmentObj), 10);
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
    this.closeModal();
  }

  logout(): void {
    this.authService.logout();
  }

  isSelectedEnv(item: any): boolean {
    return this.selectedEnvironmentObj?.name === item.name;
  }

  isSelectedRegion(item: any): boolean {
    return this.selectedRegion === item.name;
  }

  isSelectedProject(item: any): boolean {
    return this.selectedProject === item.name;
  }
}