import { Component, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from './core/icons/icon-subset';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';
import { SharedService } from './shared/services/shared.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<router-outlet />',
  imports: [RouterOutlet, HttpClientModule]
})
export class AppComponent implements OnInit {
  title = 'NIMBUZ';

  constructor(
    private router: Router,
    private titleService: Title,
    private iconSetService: IconSetService,
    private loader:SharedService
  ) {
    this.titleService.setTitle(this.title);
    this.iconSetService.icons = { ...iconSubset };
    this.router.events.subscribe(event => {
    if (event instanceof NavigationStart) {
      this.loader.show(); 
    }

    if (
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel ||
      event instanceof NavigationError
    ) {
      setTimeout(() => this.loader.hide(), 300);
    }
  });
  }

  ngOnInit(): void {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
    });
  }
}
