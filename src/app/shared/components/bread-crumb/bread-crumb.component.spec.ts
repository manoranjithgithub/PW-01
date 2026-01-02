import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { BreadCrumbComponent } from './bread-crumb.component';
import { BreadcrumbService } from '../../services/breadcrumb.service';

describe('BreadCrumbComponent', () => {
  let component: BreadCrumbComponent;
  let fixture: ComponentFixture<BreadCrumbComponent>;
  let routerEventsSubject: Subject<any>;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;

  beforeEach(async () => {
    routerEventsSubject = new Subject();

    mockRouter = {
      events: routerEventsSubject.asObservable(),
      navigate: jasmine.createSpy('navigate')
    };

    mockActivatedRoute = {
      snapshot: { params: {}, url: [], data: {}, children: [] },
      children: [],
      root: null as any
    };
    mockActivatedRoute.root = mockActivatedRoute;

    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']);

    await TestBed.configureTestingModule({
      imports: [BreadCrumbComponent, RouterTestingModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BreadCrumbComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize breadcrumbs on component init', () => {
      const mockChild = {
        snapshot: {
          url: [{ path: 'projects', parameters: {} }],
          data: { breadcrumb: 'Projects' }
        },
        children: []
      };
      mockActivatedRoute.children = [mockChild];
      mockActivatedRoute.root = mockActivatedRoute;

      fixture.detectChanges();

      expect(component.breadcrumbs.length).toBeGreaterThan(0);
      expect(component.breadcrumbs[0].label).toBe('Projects');
    });

    it('should update breadcrumbs on NavigationEnd events', () => {
      fixture.detectChanges();

      const initialLength = component.breadcrumbs.length;

      const mockChild = {
        snapshot: {
          url: [{ path: 'deployments', parameters: {} }],
          data: { breadcrumb: 'Deployments' }
        },
        children: []
      };
      mockActivatedRoute.children = [mockChild];

      routerEventsSubject.next(new NavigationEnd(1, '/deployments', '/deployments'));

      expect(component.breadcrumbs.length).toBeGreaterThan(0);
      expect(component.breadcrumbs[0].label).toBe('Deployments');
    });

    it('should filter out non-NavigationEnd events', () => {
      fixture.detectChanges();

      const breadcrumbsBefore = [...component.breadcrumbs];

      routerEventsSubject.next({ type: 'NavigationStart' });
      routerEventsSubject.next({ type: 'GuardsCheckStart' });

      expect(component.breadcrumbs).toEqual(breadcrumbsBefore);
    });
  });

  describe('createBreadcrumbs', () => {
    it('should create breadcrumbs from route with single child', () => {
      const mockChild = {
        snapshot: {
          url: [{ path: 'projects', parameters: {} }],
          data: { breadcrumb: 'Projects' }
        },
        children: []
      };
      mockActivatedRoute.children = [mockChild];

      fixture.detectChanges();

      expect(component.breadcrumbs).toEqual([
        { label: 'Projects', url: '/projects' }
      ]);
    });

    it('should create breadcrumbs from route with multiple nested children', () => {
      const grandChild = {
        snapshot: {
          url: [{ path: 'view', parameters: {} }],
          data: { breadcrumb: 'View' }
        },
        children: []
      };

      const mockChild = {
        snapshot: {
          url: [{ path: 'projects', parameters: {} }],
          data: { breadcrumb: 'Projects' }
        },
        children: [grandChild]
      };

      mockActivatedRoute.children = [mockChild];

      component.ngOnInit();

      expect(component.breadcrumbs).toEqual([
        { label: 'Projects', url: '/projects' },
        { label: 'View', url: '/projects/view' }
      ]);
    });

    it('should handle Home breadcrumb with url /projects', () => {
      const mockChild = {
        snapshot: {
          url: [],
          data: { breadcrumb: 'Home' }
        },
        children: []
      };

      mockActivatedRoute.children = [mockChild];

      fixture.detectChanges();

      expect(component.breadcrumbs).toEqual([
        { label: 'Home', url: '/projects' }
      ]);
    });

    it('should format labels by replacing dashes with spaces', () => {
      const mockChild = {
        snapshot: {
          url: [{ path: 'create-deployment', parameters: {} }],
          data: {}
        },
        children: []
      };

      mockActivatedRoute.children = [mockChild];

      fixture.detectChanges();

      expect(component.breadcrumbs[0].label).toBe('Create Deployment');
    });

    it('should capitalize first letter of each word in labels', () => {
      const mockChild = {
        snapshot: {
          url: [{ path: 'user-management', parameters: {} }],
          data: {}
        },
        children: []
      };

      mockActivatedRoute.children = [mockChild];

      fixture.detectChanges();

      expect(component.breadcrumbs[0].label).toBe('User Management');
    });

    it('should use breadcrumb data from route snapshot if available', () => {
      const mockChild = {
        snapshot: {
          url: [{ path: 'settings', parameters: {} }],
          data: { breadcrumb: 'Account Settings' }
        },
        children: []
      };

      mockActivatedRoute.children = [mockChild];

      fixture.detectChanges();

      expect(component.breadcrumbs[0].label).toBe('Account Settings');
    });

    it('should handle empty route URLs', () => {
      const mockChild = {
        snapshot: {
          url: [],
          data: { breadcrumb: 'Dashboard' }
        },
        children: []
      };

      mockActivatedRoute.children = [mockChild];

      fixture.detectChanges();
      expect(component.breadcrumbs.length).toBe(1);
      expect(component.breadcrumbs[0].label).toBe('Dashboard');
      expect(component.breadcrumbs[0].url).toBe('');
    });

    it('should handle routes without labels', () => {
      const mockChild = {
        snapshot: {
          url: [{ path: 'test', parameters: {} }],
          data: {}
        },
        children: []
      };

      mockActivatedRoute.children = [mockChild];
      fixture.detectChanges();
      expect(component.breadcrumbs[0].label).toBe('Test');
      expect(component.breadcrumbs[0].url).toBe('/test');
    });

    it('should build correct breadcrumb URLs with nested routes', () => {
      const grandGrandChild = {
        snapshot: {
          url: [{ path: 'details', parameters: {} }],
          data: { breadcrumb: 'Details' }
        },
        children: []
      };

      const grandChild = {
        snapshot: {
          url: [{ path: 'deployment-123', parameters: {} }],
          data: { breadcrumb: 'Deployment 123' }
        },
        children: [grandGrandChild]
      };

      const mockChild = {
        snapshot: {
          url: [{ path: 'deployments', parameters: {} }],
          data: { breadcrumb: 'Deployments' }
        },
        children: [grandChild]
      };

      mockActivatedRoute.children = [mockChild];

      component.ngOnInit();

      expect(component.breadcrumbs).toEqual([
        { label: 'Deployments', url: '/deployments' },
        { label: 'Deployment 123', url: '/deployments/deployment-123' },
        { label: 'Details', url: '/deployments/deployment-123/details' }
      ]);
    });

    it('should recursively process all route children', () => {
      const deepChild = {
        snapshot: {
          url: [{ path: 'level3', parameters: {} }],
          data: {}
        },
        children: []
      };

      const midChild = {
        snapshot: {
          url: [{ path: 'level2', parameters: {} }],
          data: {}
        },
        children: [deepChild]
      };

      const mockChild = {
        snapshot: {
          url: [{ path: 'level1', parameters: {} }],
          data: {}
        },
        children: [midChild]
      };

      mockActivatedRoute.children = [mockChild];

      component.ngOnInit();

      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[0].url).toBe('/level1');
      expect(component.breadcrumbs[1].url).toBe('/level1/level2');
      expect(component.breadcrumbs[2].url).toBe('/level1/level2/level3');
    });

    it('should handle Home breadcrumb followed by other breadcrumbs', () => {
      const secondChild = {
        snapshot: {
          url: [{ path: 'projects', parameters: {} }],
          data: { breadcrumb: 'My Projects' }
        },
        children: []
      };

      const homeChild = {
        snapshot: {
          url: [],
          data: { breadcrumb: 'Home' }
        },
        children: [secondChild]
      };

      mockActivatedRoute.children = [homeChild];

      component.ngOnInit();

      expect(component.breadcrumbs.length).toBe(2);
      expect(component.breadcrumbs[0]).toEqual({ label: 'Home', url: '/projects' });
      expect(component.breadcrumbs[1]).toEqual({ label: 'My Projects', url: '/projects' });
    });
  });
});
