import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ProjectsService } from './projects.service';
import { CommonModule, Location } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedService } from '../../shared/services/shared.service';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../shared/services/sidebar.service';
import { ToastrService } from 'ngx-toastr';
import { AlertComponent } from '@coreui/angular';
import { PermissionService } from '../../shared/services/permission.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AlertComponent],
  providers: [ProjectsService],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private routerSub!: Subscription;

  projectList: any = [];
  regionList: any;
  environmentList: any;
  // environmentsList: any;
  selectedProjectId: string = '';
  selectedEnvId: string = '';
  selectedRegion: string = 'ap-south-1';
  projectExhausted: boolean = false;
  environmentExhausted: boolean = false;
  orgName: string = '';
  vcsProfileInfo: any = {};

  constructor(private projectService: ProjectsService, private sharedService: SharedService,
    private authService: AuthService, private router: Router, private sideNavService: SidebarService,
    private toastr: ToastrService, private location: Location,
    public permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.getAllProjects();
    // if (this.authService.isTokenReady()) {
    //   this.getAllProjects();
    // } else {
    //   this.authService.tokenReady$.subscribe((ready) => {
    //     if (ready) {
    //       this.getAllProjects();
    //     }
    //   });
    // }
    // this.routerSub = this.router.events.subscribe(event =>{
    //   if (event instanceof NavigationEnd && event.url.includes('/projects')){
    //     this.getAllProjects();
    //   }
    // })
    this.sharedService.user$.subscribe((user: any) => {
      if (user) {
        this.orgName = user.owner;
      }
    });
  }

  getResourceUsage(envId: string): void {
    if (!envId || this.orgName !== 'nimbuz') return;
    this.projectService.getResourceUsage(envId).subscribe((res: any) => {
      if (res.status && res.data) {
        //this.sharedService.setCookie('resourceUsage', JSON.stringify(res.data), 10);
        localStorage.setItem('resourceUsage', JSON.stringify(res.data));

        const projectResource = res.data.find((r: any) => r.resource_type === 'projects');
        this.projectExhausted = projectResource?.remaining === 0;

        const environmentResource = res.data.find((r: any) => r.resource_type === 'environments');
        this.environmentExhausted = environmentResource?.remaining === 0;
      }
    });
  }

  getAllProjects(): void {
    this.sharedService.show();
    this.projectService.getAllProjects().subscribe({
      next: (res: any) => {
        this.projectList = res?.data || [];
        this.sideNavService.setProject(this.projectList);
        if (!this.projectList.length) {
          this.environmentList = [];
          localStorage.removeItem('environment');
          localStorage.removeItem('project');
          localStorage.removeItem('resourceUsage');
          this.sharedService.hide();
          return;
        }
        //const projectCookie = this.safeParseJSON(this.sharedService.getCookie('project'));
        const projectCookie = this.safeParseJSON(localStorage.getItem('project'));
        const matchedProject = this.projectList.find((p: any) => p.id === projectCookie?.id);
        this.selectedProjectId = matchedProject?.id || this.projectList[0].id;
        if (!projectCookie && this.selectedProjectId) {
          this.onProjectChange(this.projectList[0])
        }
        this.environmentList = this.getEnvironmentsByProjectId(this.selectedProjectId)
        this.extractRegions(this.projectList);
        this.sharedService.hide();
      },
      error: () => {
        this.sharedService.hide();
      }
    });
    // this.environmentList = this.getEnvironmentsByProjectId(this.selectedProjectId);
    const url = window.location.pathname;
    this.location.replaceState(url);
  }

  loadResourceUsageFromCookie(): void {
    //const usageStr = this.sharedService.getCookie('resourceUsage');
    const usageStr = localStorage.getItem('resourceUsage');
    if (!usageStr) {
      console.log('No resourceUsage cookie found.');
      return;
    }
    const resourceUsage = JSON.parse(usageStr);
    // console.log('Resource usage from cookie:', resourceUsage);

    // Example: extract projects and environments usage
    const projectQuota = resourceUsage.find((res: any) => res.resource_type === 'projects');
    const envQuota = resourceUsage.find((res: any) => res.resource_type === 'environments');

    this.projectExhausted = projectQuota?.remaining === 0;
    this.environmentExhausted = envQuota?.remaining === 0;
  }

  private safeParseJSON(json: string | null): any {
    try {
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  extractRegions(data: any[]) {
    const regions = new Set<string>();
    // data.forEach(project => {
    //   project.environments?.forEach((env: any) => {
    //     if (env?.region) {
    //       regions.add(env?.region);
    //     }
    //   });
    // });

    this.regionList = ['ap-south-1'];

    const regionFromCookie = 'ap-south-1a';
    this.selectedRegion = this.regionList.includes(regionFromCookie) ? regionFromCookie : this.regionList[0];

    if (!regionFromCookie) {
      this.onRegionChange(this.regionList[0])
    } else {
      this.filterEnvironments();
    }
  }

  onProjectChange(project: any) {
    this.selectedProjectId = project.id;
    //this.sharedService.setCookie('project', JSON.stringify(project), 10);
    localStorage.setItem('project', JSON.stringify(project));
    this.projectService.getProjectDetailsById(project.id).subscribe((res: any) => {
      this.vcsProfileInfo = {
        github: res.data.github,
        gitlab: res.data.gitlab
      }
    })
    this.environmentList = this.getEnvironmentsByProjectId(this.selectedProjectId)
    this.onRegionChange(this.selectedRegion);
  }

  onRegionChange(region: string) {
    this.selectedRegion = region;

    this.filterEnvironments();
  }

  onEnvironmentChange(env: any) {
    this.selectedEnvId = env?.id;
    // this.sharedService.setCookie('environment', JSON.stringify(env), 10);
    localStorage.setItem('environment', JSON.stringify(env));
    localStorage.getItem('resourceUsage');
    if (localStorage.getItem('resourceUsage')) {
      this.loadResourceUsageFromCookie();

    } else if (env?.id) {
      // this.getResourceUsage(env?.id);
      this.loadResourceUsageFromCookie();
    }
  }

  filterEnvironments() {
    const copiedList = [...(this.environmentList ?? [])];
    // this.environmentsList = copiedList.filter((env: any) => env.project_id === this.selectedProjectId && env.region === this.selectedRegion);
    const envCookie = this.safeParseJSON(localStorage.getItem('environment'));
    //const envCookie = this.safeParseJSON(this.sharedService.getCookie('environment'));

    const matchedEnv = this.environmentList?.find((e: any) => e.id === envCookie?.id);
    const defaultEnv = copiedList[0];

    this.selectedEnvId = matchedEnv?.id || defaultEnv?.id;
    if (matchedEnv) {
      this.onEnvironmentChange(matchedEnv);
    } else if (defaultEnv) {
      this.onEnvironmentChange(defaultEnv);
    }
  }
  getEnvironmentsByProjectId(projectId: string) {
    if (projectId === '') return [];
    this.projectService.getAllEnvironmentsByProject(projectId).subscribe((res: any) => {
      this.environmentList = res?.data || [];
      this.filterEnvironments();
    });
    return this.environmentList;
  }
  updateCookies() {
    this.router.navigate(['/applications'])
  }

  navigateToProjectPreference(project: any) {
    this.selectedProjectId = project.id;
    this.router.navigate(['/projects/project-preferences'], {
      queryParams: { projectId: this.selectedProjectId }
    });
  }

  gotoEnvironment() {
    if (this.projectList.length === 0) {
      this.toastr.warning('Please create a project before creating an environment.');
      return;
    }
    const canCreate = this.permissionService.canAdminGlobal() || this.permissionService.canWriteForCurrentUser(this.selectedProjectId, null);
    if (canCreate) {
      this.router.navigate(['/projects/create-environment']);
    } else {
      this.toastr.warning('You are not authorized to create an environment for the selected project.');
    }
  }

  gotoViewEnvironment(env: any) {
    this.selectedEnvId = env.id;
    if (this.selectedEnvId) {
      const selectedEnv = this.environmentList.find((env: any) => env.id === this.selectedEnvId);
      if (selectedEnv) {
        this.router.navigate(['/projects/environment-preferences'], {
          queryParams: {
            envName: selectedEnv.name,
            region: selectedEnv.region,
            envId: selectedEnv.id,
            projectId: this.selectedProjectId
          }
        });
      } else {
        this.toastr.error('Selected environment not found');
      }
    } else {
      this.toastr.error('Please select an environment to view');
    }
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }
}
