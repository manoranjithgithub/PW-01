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
    private sharedService: SharedService,
  ) {
    super();
  }

  @Input() sidebarId: string = 'sidebar1';
  userInfo: any


  selectedCurrency: string = localStorage.getItem('currency') || 'USD';

  ngOnInit(): void {
    this.authService.processDecodedToken(localStorage.getItem('accessToken') || '');
    this.userData = this.sharedService.getUser();
  }

  currencyOptions = [
    { code: 'USD', label: '$ USD' },
    { code: 'INR', label: '₹ INR' }
  ];


  changeCurrency(code: string) {
    this.selectedCurrency = code;
    this.sharedService.setCurrency(code);
  }

  getInitials(): string {
    const name = this.userData?.name || this.userData?.userName || '';
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      const s = parts[0];
      return (s.charAt(0) + (s.charAt(1) || '')).toUpperCase();
    }
    const first = parts[0].charAt(0) || '';
    const last = parts[parts.length - 1].charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getSelectedRegion(region: any) {
    if (region) {
      this.selectedRegion = region?.name;
      this.selectedEnvironment = region.environments[0]?.name;
      this.listOfenvironments = region.environments;
    }
  }


  logout() {
    this.colorMode.set('light');
    this.sharedService.emitValueChange('light');
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

  ngOnDestroy(): void {
    this.projectSubscription?.unsubscribe();
    this.envSubscription?.unsubscribe();
  }
}