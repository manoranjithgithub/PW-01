import { Component, OnInit } from '@angular/core';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { filter, Observable } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './bread-crumb.component.html',
  styleUrl: './bread-crumb.component.scss'
})
export class BreadCrumbComponent implements OnInit {
  breadcrumbs: Array<{ label: string; url: string }> = [];

  constructor(private router: Router, private route: ActivatedRoute, private service: BreadcrumbService) { }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.createBreadcrumbs(this.route.root);
      });
    this.breadcrumbs = this.createBreadcrumbs(this.route.root);
  }

  shouldShowBreadcrumb(): boolean {
    return true;
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: any[] = []): any[] {
    const children: ActivatedRoute[] = route.children;

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }
      let label = child.snapshot.data['breadcrumb'] || routeURL;
      if (routeURL == '' && label === 'Home') {
        breadcrumbs.push({ label, url: '/projects' });
        this.createBreadcrumbs(child, '', breadcrumbs);
        continue;
      }

      if (label) {
        label = label
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (char: any) => char.toUpperCase());

        breadcrumbs.push({ label, url });
      }
      this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
