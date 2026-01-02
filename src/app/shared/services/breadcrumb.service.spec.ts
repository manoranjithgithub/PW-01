import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot, UrlSegment } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BreadcrumbService } from './breadcrumb.service';

describe('BreadcrumbService', () => {
  let service: BreadcrumbService;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: ActivatedRoute;
  let routerEventsSubject: BehaviorSubject<any>;

  beforeEach(() => {
    routerEventsSubject = new BehaviorSubject<any>(null);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.events = routerEventsSubject.asObservable();
    const mockActivatedRoute: any = {
      root: {
        children: []
      }
    };

    TestBed.configureTestingModule({
      providers: [
        BreadcrumbService,
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute);
    service = TestBed.inject(BreadcrumbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have breadcrumbs$ observable', () => {
    expect(service.breadcrumbs$).toBeDefined();
  });

  it('should emit empty breadcrumbs on NavigationEnd when no route has title', (done) => {
    let emitted = false;
    
    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (!emitted) {
        expect(breadcrumbs).toEqual([]);
        emitted = true;
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(1, '/test', '/test'));
  });

  it('should create breadcrumbs from route with title', (done) => {
    const mockSnapshot: any = {
      data: { title: 'Dashboard' },
      url: [{ path: 'dashboard' } as UrlSegment]
    };

    const mockChild: any = {
      snapshot: mockSnapshot,
      children: []
    };

    (activatedRoute.root as any).children = [mockChild];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (breadcrumbs.length > 0) {
        expect(breadcrumbs.length).toBe(1);
        expect(breadcrumbs[0].label).toBe('Dashboard');
        expect(breadcrumbs[0].url).toBe('/dashboard');
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(2, '/dashboard', '/dashboard'));
  });

  it('should create breadcrumbs with multiple segments', (done) => {
    const mockSnapshot: any = {
      data: { title: 'User Details' },
      url: [
        { path: 'users' } as UrlSegment,
        { path: '123' } as UrlSegment
      ]
    };

    const mockChild: any = {
      snapshot: mockSnapshot,
      children: []
    };

    (activatedRoute.root as any).children = [mockChild];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (breadcrumbs.length > 0) {
        expect(breadcrumbs.length).toBe(1);
        expect(breadcrumbs[0].label).toBe('User Details');
        expect(breadcrumbs[0].url).toBe('/users/123');
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(3, '/users/123', '/users/123'));
  });

  it('should skip routes without title', (done) => {
    const mockSnapshotWithoutTitle: any = {
      data: {},
      url: [{ path: 'no-title' } as UrlSegment]
    };

    const mockSnapshotWithTitle: any = {
      data: { title: 'Projects' },
      url: [{ path: 'projects' } as UrlSegment]
    };

    const mockChildWithTitle: any = {
      snapshot: mockSnapshotWithTitle,
      children: []
    };

    const mockChildWithoutTitle: any = {
      snapshot: mockSnapshotWithoutTitle,
      children: [mockChildWithTitle]
    };

    (activatedRoute.root as any).children = [mockChildWithoutTitle];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (breadcrumbs.length > 0) {
        expect(breadcrumbs.length).toBe(1);
        expect(breadcrumbs[0].label).toBe('Projects');
        expect(breadcrumbs[0].url).toBe('/projects');
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(4, '/no-title/projects', '/no-title/projects'));
  });

  it('should handle nested routes with titles', (done) => {
    const mockSnapshot1: any = {
      data: { title: 'Admin' },
      url: [{ path: 'admin' } as UrlSegment]
    };

    const mockSnapshot2: any = {
      data: { title: 'Users' },
      url: [{ path: 'users' } as UrlSegment]
    };

    const mockChild2: any = {
      snapshot: mockSnapshot2,
      children: []
    };

    const mockChild1: any = {
      snapshot: mockSnapshot1,
      children: [mockChild2]
    };

    (activatedRoute.root as any).children = [mockChild1];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (breadcrumbs.length > 0) {
        expect(breadcrumbs.length).toBe(2);
        expect(breadcrumbs[0].label).toBe('Admin');
        expect(breadcrumbs[0].url).toBe('/admin');
        expect(breadcrumbs[1].label).toBe('Users');
        expect(breadcrumbs[1].url).toBe('/users');
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(5, '/admin/users', '/admin/users'));
  });

  it('should filter out non-NavigationEnd events', (done) => {
    let emissionCount = 0;
    
    service.breadcrumbs$.subscribe(() => {
      emissionCount++;
    });
    routerEventsSubject.next({ id: 1, url: '/test' });
    routerEventsSubject.next({ id: 2, url: '/another' });

    setTimeout(() => {
      expect(emissionCount).toBe(1);
      done();
    }, 100);
  });

  it('should handle route with empty children array', (done) => {
    let emitted = false;
    
    (activatedRoute.root as any).children = [];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (!emitted) {
        expect(breadcrumbs).toEqual([]);
        emitted = true;
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(6, '/empty', '/empty'));
  });

  it('should handle route with empty url segments', (done) => {
    const mockSnapshot: any = {
      data: { title: 'Root' },
      url: []
    };

    const mockChild: any = {
      snapshot: mockSnapshot,
      children: []
    };

    (activatedRoute.root as any).children = [mockChild];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (breadcrumbs.length > 0) {
        expect(breadcrumbs.length).toBe(1);
        expect(breadcrumbs[0].label).toBe('Root');
        expect(breadcrumbs[0].url).toBe('/');
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(7, '/', '/'));
  });

  it('should update breadcrumbs on subsequent NavigationEnd events', (done) => {
    const emissions: any[] = [];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      emissions.push([...breadcrumbs]);
    });
    (activatedRoute.root as any).children = [];
    routerEventsSubject.next(new NavigationEnd(8, '/first', '/first'));

    setTimeout(() => {
      const mockSnapshot: any = {
        data: { title: 'Second' },
        url: [{ path: 'second' } as UrlSegment]
      };

      const mockChild: any = {
        snapshot: mockSnapshot,
        children: []
      };

      (activatedRoute.root as any).children = [mockChild];
      routerEventsSubject.next(new NavigationEnd(9, '/second', '/second'));

      setTimeout(() => {
        expect(emissions.length).toBeGreaterThan(2);
        expect(emissions[emissions.length - 1].length).toBe(1);
        expect(emissions[emissions.length - 1][0].label).toBe('Second');
        done();
      }, 50);
    }, 50);
  });

  it('should handle route with null data', (done) => {
    let emitted = false;
    
    const mockSnapshot: any = {
      data: {},
      url: [{ path: 'null-data' } as UrlSegment]
    };

    const mockChild: any = {
      snapshot: mockSnapshot,
      children: []
    };

    (activatedRoute.root as any).children = [mockChild];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (!emitted) {
        expect(breadcrumbs).toEqual([]);
        emitted = true;
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(10, '/null-data', '/null-data'));
  });

  it('should handle route with undefined title', (done) => {
    let emitted = false;
    
    const mockSnapshot: any = {
      data: { title: undefined },
      url: [{ path: 'undefined-title' } as UrlSegment]
    };

    const mockChild: any = {
      snapshot: mockSnapshot,
      children: []
    };

    (activatedRoute.root as any).children = [mockChild];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (!emitted) {
        expect(breadcrumbs).toEqual([]);
        emitted = true;
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(11, '/undefined-title', '/undefined-title'));
  });

  it('should handle deeply nested routes', (done) => {
    const mockSnapshot: any = {
      data: { title: 'Level 1' },
      url: [{ path: 'level1' } as UrlSegment]
    };

    let currentChild: any = {
      snapshot: mockSnapshot,
      children: []
    };

    for (let i = 2; i <= 5; i++) {
      const parentSnapshot: any = {
        data: {},
        url: []
      };
      
      currentChild = {
        snapshot: parentSnapshot,
        children: [currentChild]
      };
    }

    (activatedRoute.root as any).children = [currentChild];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (breadcrumbs.length > 0) {
        expect(breadcrumbs.length).toBe(1);
        expect(breadcrumbs[0].label).toBe('Level 1');
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(12, '/deep/nested', '/deep/nested'));
  });

  it('should build url correctly with existing url prefix', (done) => {
    const mockSnapshot: any = {
      data: { title: 'Deployments' },
      url: [{ path: 'deployments' } as UrlSegment]
    };

    const mockChild: any = {
      snapshot: mockSnapshot,
      children: []
    };

    (activatedRoute.root as any).children = [mockChild];

    service.breadcrumbs$.subscribe(breadcrumbs => {
      if (breadcrumbs.length > 0) {
        expect(breadcrumbs[0].url).toBe('/deployments');
        done();
      }
    });

    routerEventsSubject.next(new NavigationEnd(13, '/deployments', '/deployments'));
  });
});
