import { Component, computed, ElementRef, HostListener, inject, OnInit, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterLink, RouterOutlet, Event as RouterEvent } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';

import { IconDirective } from '@coreui/icons-angular';
import {
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective,
} from '@coreui/angular';

import { navItems } from './_nav';
import { CommonModule, NgIf } from '@angular/common';
import { DefaultFooterComponent } from './default-footer/default-footer.component';
import { DefaultHeaderComponent } from './default-header/default-header.component';
import { AuthService } from '../../../../core/services/auth.service';
import { DeploymentsService } from '../../../services/deployments.service';
import { BreadCrumbComponent } from '../../bread-crumb/bread-crumb.component';
import { pageHeaders } from '../../../../core/constants/resource';
import { Title } from '@angular/platform-browser';
import { delay, filter, tap } from 'rxjs/operators';
import { SharedService } from '../../../services/shared.service';
import { SidebarService } from '../../../services/sidebar.service';
import { SwitchProjectComponent } from "../switch-project/switch-project.component";
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../loader/loader.component';
import { ProjectsService } from '../../../../pages/projects/projects.service';
import { LayoutActionService } from '../../../services/layout-action.service';

// function isOverflown(element: HTMLElement) {
//   return (
//     element.scrollHeight > element.clientHeight ||
//     element.scrollWidth > element.clientWidth
//   );
// }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    RouterLink,
    NgScrollbar,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    DefaultHeaderComponent,
    ShadowOnScrollDirective,
    ContainerComponent,
    RouterOutlet,
    CommonModule,
    BreadCrumbComponent,
    SwitchProjectComponent,
    LoaderComponent,
    DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective
  ],
  providers: [DeploymentsService, ProjectsService],
  encapsulation: ViewEncapsulation.None
})
export class DefaultLayoutComponent implements OnInit {
  public navItems = navItems;
  isScrolled = false;
  userInfo: any;
  pageHeaders = pageHeaders;
  pageTitle: string = '';
  subText: string = '';
  currentUrl: string = '';
  showSwitchProject = false;

  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;
  @ViewChild('sidebar1', { read: ElementRef }) sidebarRef!: ElementRef;
  @ViewChild(RouterOutlet, { static: true }) routerOutlet!: RouterOutlet;
  showPageActionButton = false;
  openDropdown = '';
  selectedItemFromCom: string | null = null;
  currentUser: string = '';
  savedTheme: string = '';


  constructor(private authService: AuthService, private deployemntService: DeploymentsService,
    private router: Router, private titleService: Title, private ac: ActivatedRoute,
    private sharedService: SharedService, private sidebarService: SidebarService, private renderer: Renderer2,
    private toastr: ToastrService, private projectService: ProjectsService,
    private layoutActionService: LayoutActionService
  ) {

    this.#colorModeService.localStorageItemName.set('coreui-free-angular-admin-template-theme-default');

    this.router.events.pipe(
      filter((event): event is NavigationStart | NavigationEnd =>
        event instanceof NavigationStart || event instanceof NavigationEnd
      ),
      tap((event: NavigationStart | NavigationEnd) => {
        if (event instanceof NavigationStart) {
          const allowedRoutes = [
            '/projects',
            '/create-project',
            '/create-environment',
            '/account-settings',
            '/projects/project-preferences',
            '/users-list',
          ];
          const publicRoutes = ['/', '/login', '/create-account', '/logout', '/login'];
          if (this.currentUser !== 'nimbuz') {
            allowedRoutes.push('/users-list');
          }

          // const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          //   const [name, value] = cookie.split('=').map(c => c.trim());
          //   acc[name] = decodeURIComponent(value);
          //   return acc;
          // }, {} as Record<string, string>);

          // const environment = cookies['environment'];
          // const project = cookies['project'];
          const environment = localStorage.getItem('environment');
          const project = localStorage.getItem('project');

          const isProjectMissing = !project || project === 'undefined';
          const isEnvironmentMissing = !environment || environment === 'undefined';

          const urlWithoutParams = event.url.split('?')[0];
          const isAllowed = allowedRoutes.some(route => urlWithoutParams.startsWith(route));
          const isPublicRoute = publicRoutes.includes(urlWithoutParams);

          if ((isProjectMissing || isEnvironmentMissing) && !isAllowed && !isPublicRoute) {
            this.toastr.warning('Please select a project and environment before continuing.');
            this.router.navigateByUrl('/projects', { replaceUrl: true });
            return;
          }
        }

        if (event instanceof NavigationEnd) {
          this.updateTitle();
          this.updateButtonVisibility();
        }

        this.currentUrl = this.router.url;
      })
    ).subscribe();

    this.layoutActionService.extraTitle$.subscribe(title => {
      this.selectedItemFromCom = title;
    });

  }

  @HostListener('window:scroll', [])
  onScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  onScrollbarUpdate($event: any) {
    // console.log($event.verticalUsed)

  }

  isProjectsPage(): boolean {
    return ['/projects', '/environment', '/create-project', '/create-environment', '/create-account'].some(path =>
      this.currentUrl.includes(path)
    );
    // return this.currentUrl.includes('/project');
  }

  ngOnInit(): void {
    this.savedTheme = localStorage.getItem('theme') || 'light';
    // console.log('Saved theme:', this.savedTheme);
    this.colorMode.set(this.savedTheme);
    // if (this.router.url.includes('/projects') && window.location.href.includes('code')) {
    //   this.ac.queryParams.subscribe(params => {
    //     if (params['code']) {
    //       this.casdoorService.getCasdoorToken(params['code'], params['state']).subscribe((res: any) => {
    //         if (res.status === 'success') {
    //           this.authService.setAccessToken(res.data);
    //         } else {
    //           this.authService.logout();
    //         }
    //       });
    //     }

    //   });
    // } else {
    //   const token = this.authService.getAccessToken();
    //   if (!token) {
    //     this.authService.logout();
    //   }
    // }
    // if (this.authService.isTokenReady()) {
    //   this.initApp();
    // } else {
    //   this.authService.tokenReady$.subscribe((ready) => {
    //     if (ready) {
    //       this.initApp();
    //     }
    //   });


    // }


    this.sidebarService.sidebarToggle$.subscribe((visible) => {
      const sidebarEl = this.sidebarRef.nativeElement;

      if (sidebarEl) {
        if (visible) {
          this.renderer.addClass(sidebarEl, 'show');
          this.renderer.removeClass(sidebarEl, 'hide');
        } else {
          this.renderer.addClass(sidebarEl, 'hide');
          this.renderer.removeClass(sidebarEl, 'show');
        }
      }
    });
    this.sharedService.user$.subscribe((userData: any) => {
      const user = localStorage.getItem('profileSettings') ? JSON.parse(localStorage.getItem('profileSettings') || '{}') : null;
      this.currentUser = user?.owner
      const baseItems = [...navItems];
      if (user?.owner !== 'nimbuz') {
        baseItems.push({ name: 'Users', url: '/users-list', icon: 'bi bi-people-fill' });
      }
      this.navItems = baseItems;
    });
  }

  updateTitle(): void {
    const currentUrl = this.router.url.split('?')[0];
    const matchedTitle = this.pageHeaders.find((title: any) => title.url === currentUrl);
    if (matchedTitle) {
      this.titleService.setTitle(matchedTitle.title);
      this.pageTitle = matchedTitle.title;
      this.subText = matchedTitle.subText
    } else {
      this.titleService.setTitle('');
      this.pageTitle = '';
    }

    const project = localStorage.getItem('project');
    this.showSwitchProject = !!project && project !== 'undefined';
  }
  setTheme(event: Event) {
    const color = (event.target as HTMLInputElement).checked ? 'light' : 'dark';
    // this.sharedService.setCookie('theme', color, 10)\
    localStorage.setItem('theme', color);
    this.colorMode.set(color);
    this.sharedService.emitValueChange(color);
    this.#colorModeService.setStoredTheme('selectedTheme', color);
  }
  onPageActionClick() {
    this.layoutActionService.triggerAction();
  }
  updateButtonVisibility() {
    const currentUrl = this.router.url;
    this.showPageActionButton = currentUrl.includes('/project-preferences');
  }
  toggleDropdown(source: string, event: MouseEvent) {
    this.openDropdown = source;
  }
  logout() {
    this.authService.logout();
  }
  getItemName(): string {
    return this.selectedItemFromCom?.split(' (')[0] || '';
  }

  getItemStatus(): string {
    const match = this.selectedItemFromCom?.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  }
}
