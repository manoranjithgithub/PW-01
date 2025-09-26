import { Component, computed, inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
  AvatarComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  HeaderComponent,
  HeaderNavComponent,
  TextColorDirective,
  ThemeDirective
} from '@coreui/angular';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';

import { SharedService } from '../../../../services/shared.service';
import { Subscription } from 'rxjs';
import { DeploymentsService } from '../../../../../shared/services/deployments.service';
import { ProjectsService } from '../../../../../pages/projects/projects.service';
import { ListItem } from '../../../../../core/models/list-item.model';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  styleUrls: ['./default-header.component.scss'],
  standalone: true,
  imports: [ContainerComponent, AvatarComponent,
    IconDirective, HeaderNavComponent, RouterLink, NgTemplateOutlet, ThemeDirective,
    DropdownComponent, DropdownToggleDirective, TextColorDirective,
    DropdownMenuDirective, DropdownItemDirective, CommonModule],
  providers: [DeploymentsService, ProjectsService]
})

export class DefaultHeaderComponent extends HeaderComponent implements OnInit, OnDestroy {

  @Input() userData: any;

  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;

  readonly colorModes = [
    { name: 'light', text: 'Light', icon: 'cilSun' },
    { name: 'dark', text: 'Dark', icon: 'cilMoon' }
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  private projectSubscription: Subscription | undefined;
  private envSubscription: Subscription | undefined;
  listOfenvironments: ListItem[] = [];
  listOfProjects: ListItem[] = [];
  listOfRegions: ListItem[] = [];
  selectedEnvironment: string = '';
  selectedProject: string = '';
  selectedRegion: string = '';
  projectId: string = '';
  routeName: any =
    localStorage.getItem('routeName') === "Login Page" ||
      localStorage.getItem('routeName') === "Environment Page"
      ? 'Deployments'
      : localStorage.getItem('routeName');

  constructor(private authService: AuthService,
    private sharedService: SharedService, private http: DeploymentsService,
    private projectService: ProjectsService, private deployemntService: DeploymentsService
  ) {
    super();
  }

  @Input() sidebarId: string = 'sidebar1';
  userInfo: any



  ngOnInit(): void {
    // if (this.authService.isTokenReady()) {
    //   this.deployemntService.getAccountInfo().subscribe((res: any) => {
    //     this.userInfo = res.data;
    //     console.log(this.userInfo)
    //   });
    // } else {
    //   this.authService.tokenReady$.subscribe((ready) => {
    //     if (ready) {
    //       console.log(this.userInfo)
    //     }
    //   });
    // }

    // this.sharedService.user$.subscribe(user => {
    //   this.userData = user;
    // });
    this.userData = localStorage.getItem('profileSettings') ? JSON.parse(localStorage.getItem('profileSettings') || '{}') : null;
    // console.log(this.userData)
  }

  private getEnvironment() {
    if (!this.projectId) return;
    this.projectService.getEnvironmentsByProject(this.projectId).subscribe((res: any) => {
      if (res?.data && res.data.length > 0) {
        this.getSelectedEnv(res.data[0]);
        this.listOfenvironments = res?.data;
        this.selectedEnvironment = res.data[0]?.name;
      } else {
        this.selectedEnvironment = '';
        this.listOfenvironments = [];
      }
    },
      (err) => {
        this.selectedEnvironment = '';
        this.listOfenvironments = [];
      });
  }
  getSelectedEnv(env: any) {
    if (env) {
      //this.sharedService.setCookie('environment', JSON.stringify(env), 10);
      localStorage.setItem('environment', JSON.stringify(env));
      this.selectedEnvironment = env?.name;
      console.log(this.selectedEnvironment);
      this.sharedService.emitEnvValueChange(env);
    }
  }

  getSelectedRegion(region: any) {
    if (region) {
     // this.sharedService.setCookie('region', JSON.stringify(region), 10);
      localStorage.setItem('region', JSON.stringify('ap-south-1'));
      this.selectedRegion = region?.name;
      this.selectedEnvironment = region.environments[0]?.name;
      this.listOfenvironments = region.environments;
    }
  }

  // getSelectedProject(project: any) {
  //   if (project) {
  //     this.sharedService.setCookie('project', JSON.stringify(project), 10);
  //     this.sharedService.emitProjectValueChange(project);  // Notify other components
  //     this.selectedProject = project?.name;
  //     this.projectId = project?.id;
  //     this.getEnvironment();
  //     console.log(this.selectedProject);
  //     this.getRegionsAndEnvironment();  // Load environment list for selected project
  //   }
  // }

  logout() {
    this.authService.logout();
  }
  isSelectedEnv(item: any): boolean {
    return this.selectedEnvironment === item.name;
  }
  isSelectedRegion(item: any): boolean {
    return this.selectedRegion === item.name;
  }
  isSelectedProject(item: any): boolean {
    return this.selectedProject === item.name;
  }

  // public getRegionsAndEnvironment() {
  //   if (!this.projectId) return;

  //   this.projectService.getProjectById(this.projectId, true).subscribe((res: any) => {
  //     if (res?.data) {
  //       if (res.data.regions?.length > 0) {
  //         this.listOfRegions = res.data.regions;
  //         this.selectedRegion = res.data.regions[0]?.name;
  //         if (res.data.regions[0]?.environments?.length > 0) {
  //           this.getSelectedRegion(res.data.regions[0]);
  //         }
  //       }
  //     } else {
  //       this.selectedRegion = '';
  //       this.listOfRegions = [];
  //       this.selectedEnvironment = '';
  //       this.listOfenvironments = [];
  //     }
  //   },
  //     (err) => {
  //       this.selectedRegion = '';
  //       this.listOfRegions = [];
  //       this.selectedEnvironment = '';
  //       this.listOfenvironments = [];
  //     });
  // }

  // private getBasicInfo() {
  //   const project = this.sharedService.getCookie('project');
  //   this.projectService.getAllProjects().subscribe((res: any) => {
  //     this.listOfProjects = res?.data;
  //     if (project && this.listOfProjects.find(item => item.name === JSON.parse(project)?.name) !== undefined) {
  //       this.selectedProject = JSON.parse(project)?.name;
  //       this.projectId = JSON.parse(project)?.id;
  //       this.getRegionsAndEnvironment();
  //     } else {
  //       this.getSelectedProject(res?.data[0]);
  //     }
  //   });
  // }

  ngOnDestroy(): void {
    this.projectSubscription?.unsubscribe();
    this.envSubscription?.unsubscribe();
  }
}