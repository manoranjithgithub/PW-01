import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectsComponent } from './projects.component';
import { ProjectsService } from './projects.service';
import { SharedService } from '../../shared/services/shared.service';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../shared/services/sidebar.service';
import { PermissionService } from '../../shared/services/permission.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, Subscription } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  let projectsServiceSpy: jasmine.SpyObj<ProjectsService>;
  let sharedServiceSpy: jasmine.SpyObj<SharedService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let sidebarSpy: jasmine.SpyObj<SidebarService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let permissionSpy: jasmine.SpyObj<PermissionService>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    projectsServiceSpy = jasmine.createSpyObj('ProjectsService', [
      'getAllProjects',
      'getAllEnvironmentsByProject',
      'getProjectDetailsById',
      'getResourceUsage'
    ]);

    // default stubs to avoid undefined subscribe errors when ngOnInit or onProjectChange calls service methods
    projectsServiceSpy.getAllProjects.and.returnValue(of({ data: [] }));
    projectsServiceSpy.getAllEnvironmentsByProject.and.returnValue(of({ data: [] }));
    projectsServiceSpy.getProjectDetailsById.and.returnValue(of({ data: { github: false, gitlab: false } }));

    sharedServiceSpy = jasmine.createSpyObj(
      'SharedService',
      ['show'],
      { user$: of({ owner: 'nimbuz' }) }
    );

    authServiceSpy = jasmine.createSpyObj('AuthService', ['isTokenReady']);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    sidebarSpy = jasmine.createSpyObj('SidebarService', ['setProject']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['warning', 'error']);
    permissionSpy = jasmine.createSpyObj('PermissionService', [
      'canAdminGlobal',
      'canWriteForCurrentUser'
    ]);
    locationSpy = jasmine.createSpyObj('Location', ['replaceState']);

    // Ensure the standalone component's provider is overridden by our spy
    TestBed.overrideProvider(ProjectsService, { useValue: projectsServiceSpy });

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent, HttpClientTestingModule],
      providers: [
        { provide: SharedService, useValue: sharedServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: SidebarService, useValue: sidebarSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: PermissionService, useValue: permissionSpy },
        { provide: Location, useValue: locationSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should set orgName from SharedService user$', () => {
    component.ngOnInit();
    expect(component.orgName).toBe('nimbuz');
  });

  it('should load projects and set sidebar', () => {
    const projects = [{ id: 'p1', name: 'Project 1' }];
    projectsServiceSpy.getAllProjects.and.returnValue(of({ data: projects }));
    projectsServiceSpy.getAllEnvironmentsByProject.and.returnValue(of({ data: [] }));

    component.getAllProjects();

    expect(sharedServiceSpy.show).toHaveBeenCalled();
    expect(projectsServiceSpy.getAllProjects).toHaveBeenCalled();
    expect(component.projectList.length).toBe(1);
    expect(sidebarSpy.setProject).toHaveBeenCalledWith(projects);
  });

  it('should clear environment when no projects exist', () => {
    projectsServiceSpy.getAllProjects.and.returnValue(of({ data: [] }));

    component.getAllProjects();

    expect(component.environmentList).toEqual([]);
  });


  it('should change project and load environments', () => {
    const project = { id: 'p1' };

    projectsServiceSpy.getProjectDetailsById.and.returnValue(
      of({ data: { github: true, gitlab: false } })
    );
    projectsServiceSpy.getAllEnvironmentsByProject.and.returnValue(
      of({ data: [{ id: 'env1' }] })
    );

    component.onProjectChange(project);

    expect(localStorage.getItem('project')).toContain('p1');
    expect(projectsServiceSpy.getProjectDetailsById).toHaveBeenCalledWith('p1');
  });


  it('should change environment and store it', () => {
    const env = { id: 'env1', name: 'Env 1' };
    spyOn(component, 'loadResourceUsageFromCookie');

    component.onEnvironmentChange(env);

    expect(localStorage.getItem('environment')).toContain('env1');
    expect(component.selectedEnvId).toBe('env1');
    expect(component.loadResourceUsageFromCookie).toHaveBeenCalled();
  });


  it('should navigate to deployment on updateCookies', () => {
    component.updateCookies();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/deployment']);
  });

  it('should navigate to project preferences', () => {
    component.navigateToProjectPreference({ id: 'p1' });

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/projects/project-preferences'],
      { queryParams: { projectId: 'p1' } }
    );
  });


  it('should block environment creation without permission', () => {
    component.projectList = [{ id: 'p1' }];
    permissionSpy.canAdminGlobal.and.returnValue(false);
    permissionSpy.canWriteForCurrentUser.and.returnValue(false);

    component.gotoEnvironment();

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  it('should allow environment creation with permission', () => {
    component.projectList = [{ id: 'p1' }];
    component.selectedProjectId = 'p1';
    permissionSpy.canAdminGlobal.and.returnValue(true);

    component.gotoEnvironment();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/projects/create-environment']);
  });


  it('should navigate to environment preferences', () => {
    component.selectedProjectId = 'p1';
    component.environmentList = [
      { id: 'env1', name: 'Env', region: 'ap-south-1' }
    ];

    component.gotoViewEnvironment({ id: 'env1' });

    expect(routerSpy.navigate).toHaveBeenCalled();
  });

  it('should show error if environment not found', () => {
    component.environmentList = [];
    component.gotoViewEnvironment({ id: 'env1' });

    expect(toastrSpy.error).toHaveBeenCalled();
  });


  it('should unsubscribe routerSub on destroy', () => {
    const sub = new Subscription();
    spyOn(sub, 'unsubscribe');
    (component as any).routerSub = sub;

    component.ngOnDestroy();

    expect(sub.unsubscribe).toHaveBeenCalled();
  });

  it('getResourceUsage should not call service when orgName is not nimbuz', () => {
    component.orgName = 'other';
    const spy = projectsServiceSpy.getResourceUsage as jasmine.Spy;
    component.getResourceUsage('e1');
    expect(spy).not.toHaveBeenCalled();
  });

  it('getResourceUsage should set exhausted flags and localStorage when orgName is nimbuz', () => {
    component.orgName = 'nimbuz';
    const mockData = [
      { resource_type: 'projects', remaining: 0 },
      { resource_type: 'environments', remaining: 0 }
    ];
    projectsServiceSpy.getResourceUsage = jasmine.createSpy().and.returnValue(of({ status: true, data: mockData }));

    component.getResourceUsage('env1');

    expect(localStorage.getItem('resourceUsage')).toBe(JSON.stringify(mockData));
    expect(component.projectExhausted).toBeTrue();
    expect(component.environmentExhausted).toBeTrue();
  });

  it('safeParseJSON should return null for invalid json and object for valid json', () => {
    const bad = component['safeParseJSON']('not-json');
    expect(bad).toBeNull();

    const good = component['safeParseJSON'](JSON.stringify({ a: 1 }));
    expect(good).toEqual({ a: 1 });
  });

  it('getEnvironmentsByProjectId should return [] for empty id', () => {
    const res = component.getEnvironmentsByProjectId('');
    expect(res).toEqual([]);
  });

  it('getEnvironmentsByProjectId should call service and set environmentList', () => {
    const envs = [{ id: 'e1' }];
    projectsServiceSpy.getAllEnvironmentsByProject.and.returnValue(of({ data: envs }));
    component.environmentList = [];
    const res = component.getEnvironmentsByProjectId('p1');
    expect(projectsServiceSpy.getAllEnvironmentsByProject).toHaveBeenCalledWith('p1');
    expect(component.environmentList).toEqual(envs);
  });
});
