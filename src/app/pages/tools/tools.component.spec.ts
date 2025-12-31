import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToolsComponent } from './tools.component';
import { ToolsService } from './tools.service';
import { SharedService } from '../../shared/services/shared.service';
import { PermissionService } from '../../shared/services/permission.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { of, Subject, Subscription, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ToolsComponent', () => {
  let component: ToolsComponent;
  let fixture: ComponentFixture<ToolsComponent>;

  let toolsServiceSpy: jasmine.SpyObj<ToolsService>;
  let sharedServiceSpy: jasmine.SpyObj<SharedService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let modalSpy: jasmine.SpyObj<NgbModal>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  const envChange$ = new Subject<any>();

  beforeEach(async () => {
    toolsServiceSpy = jasmine.createSpyObj('ToolsService', [
      'liveToolsData',
      'deleteTools'
    ]);
    toolsServiceSpy.liveToolsData.and.returnValue(of({ tools: {} }));

    sharedServiceSpy = jasmine.createSpyObj('SharedService', [
      'getStatusMeta'
    ], {
      envValueChange$: envChange$.asObservable(),
      valueChange$: of('ag-theme-alpine'),
      isLoading$: of(false)
    });

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    (routerSpy as any).url = '/tools';
    modalSpy = jasmine.createSpyObj('NgbModal', ['open']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success']);

    TestBed.overrideComponent(ToolsComponent, {
      set: {
        providers: [{ provide: ToolsService, useValue: toolsServiceSpy }]
      }
    });

    await TestBed.configureTestingModule({
      imports: [ToolsComponent, HttpClientTestingModule],
      providers: [
        { provide: SharedService, useValue: sharedServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NgbModal, useValue: modalSpy },
        { provide: ToastrService, useValue: toastrSpy },
        PermissionService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load tools on init if environment exists', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-1' }));

    const mockResponse = {
      tools: {
        t1: { _id: '1', name: 'MySQL', schemaId: 'mysql' }
      }
    };

    toolsServiceSpy.liveToolsData.and.returnValue(of(mockResponse));

    component.ngOnInit();

    expect(toolsServiceSpy.liveToolsData).toHaveBeenCalledWith('env-1');
    expect(component.rowData.length).toBe(1);
  });

  it('should navigate to environments if env is missing', () => {
    // ensure no environment is present in storage
    localStorage.removeItem('environment');

    component.ngOnInit();
    fixture.detectChanges();

    envChange$.next({});

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/environments']);
  });

  it('should navigate to create tool page', () => {
    component.addTools();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tools/create-tool']);
  });

  it('should navigate to view tool with query params', () => {
    const tool = { name: 'MySQL' };

    component.gotoAction(tool);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/tools/view-tool'],
      { queryParams: { selectedView: 'MySQL' } }
    );
  });

  it('should subscribe to liveToolsData and update tools', () => {
    const response = {
      tools: {
        t1: { _id: '1', name: 'Postgres', schemaId: 'postgres' }
      }
    };

    toolsServiceSpy.liveToolsData.and.returnValue(of(response));

    component.getAvailableTools('env-123');

    expect(toolsServiceSpy.liveToolsData).toHaveBeenCalledWith('env-123');
    expect(component.rowData[0].name).toBe('Postgres');
  });

  it('should update existing tool when data changes', () => {
    component.rowData = [
      { _id: '1', name: 'MySQL', status: 'old' }
    ];

    component.updateTools([
      { _id: '1', name: 'MySQL', status: 'new' }
    ]);

    expect(component.rowData[0].status).toBe('new');
  });

  it('should add new tool if not exists', () => {
    component.rowData = [];

    component.updateTools([
      { _id: '2', name: 'MongoDB' }
    ]);

    expect(component.rowData.length).toBe(1);
  });

  it('should delete tool on confirmation', async () => {
    component.envId = 'env-1';
    component.toolName = 'MySQL';

    const modalReturn = {
      componentInstance: {},
      result: Promise.resolve(true)
    } as any;

    modalSpy.open.and.returnValue(modalReturn);

    toolsServiceSpy.deleteTools.and.returnValue(of({ success: true }));

    component.openConfirmationDialog();

    await modalReturn.result;

    expect(toolsServiceSpy.deleteTools).toHaveBeenCalledWith('env-1', 'MySQL');
    expect(toastrSpy.success).toHaveBeenCalledWith('Deleted Successfully');
  });

  it('should clean up subscriptions on destroy', () => {
    component['subscription'] = new Subscription();
    component.sseSub = new Subscription();

    spyOn(component['subscription'], 'unsubscribe');
    spyOn(component.sseSub, 'unsubscribe');

    component.ngOnDestroy();

    expect(component['subscription']?.unsubscribe).toHaveBeenCalled();
    expect(component.sseSub?.unsubscribe).toHaveBeenCalled();
  });

  it('should handle environment when storedValue is undefined', () => {
    localStorage.setItem('environment', 'undefined');
    const comp = new ToolsComponent(toolsServiceSpy, routerSpy, sharedServiceSpy, modalSpy, toastrSpy, TestBed.inject(PermissionService));
    expect(comp.envId).toBe('');
  });

  it('should parse environment id when storedValue is valid JSON', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'test-env' }));
    const comp = new ToolsComponent(toolsServiceSpy, routerSpy, sharedServiceSpy, modalSpy, toastrSpy, TestBed.inject(PermissionService));
    expect(comp.envId).toBe('test-env');
  });

  it('getCurrentProjectId should return undefined when project is not set', () => {
    localStorage.removeItem('project');
    expect(component.getCurrentProjectId()).toBeUndefined();
  });

  it('getCurrentProjectId should return undefined when project is "undefined"', () => {
    localStorage.setItem('project', 'undefined');
    expect(component.getCurrentProjectId()).toBeUndefined();
  });

  it('getCurrentProjectId should parse JSON and return id', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-123' }));
    expect(component.getCurrentProjectId()).toBe('proj-123');
  });

  it('getCurrentProjectId should return undefined when parsed object has no id', () => {
    localStorage.setItem('project', JSON.stringify({ name: 'test' }));
    expect(component.getCurrentProjectId()).toBeUndefined();
  });

  it('getCurrentProjectId should return string when JSON parse fails', () => {
    localStorage.setItem('project', 'plain-id');
    expect(component.getCurrentProjectId()).toBe('plain-id');
  });

  it('ngOnInit should handle missing environment in localStorage', () => {
    localStorage.removeItem('environment');
    
    component.ngOnInit();
    
    // When environment is missing, getAvailableTools should not be called
    expect(toolsServiceSpy.liveToolsData).not.toHaveBeenCalled();
  });

  it('ngOnInit should handle invalid JSON in environment', () => {
    spyOn(console, 'warn');
    localStorage.setItem('environment', 'invalid-json{');
    
    component.ngOnInit();
    
    expect(console.warn).toHaveBeenCalledWith('Could not parse environment from localStorage', jasmine.any(Error));
  });

  it('ngOnInit should handle environment object without id', () => {
    localStorage.setItem('environment', JSON.stringify({ name: 'test' }));
    
    component.ngOnInit();
    
    expect(toolsServiceSpy.liveToolsData).not.toHaveBeenCalled();
  });

  it('ngOnInit should getAvailableTools when environment has valid id', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-valid' }));
    toolsServiceSpy.liveToolsData.and.returnValue(of({ tools: {} }));
    
    component.ngOnInit();
    
    expect(toolsServiceSpy.liveToolsData).toHaveBeenCalledWith('env-valid');
  });

  it('should unsubscribe existing sseSub when envValueChange$ emits', fakeAsync(() => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-new' }));
    const oldSub = new Subscription();
    spyOn(oldSub, 'unsubscribe');
    component.sseSub = oldSub;
    toolsServiceSpy.liveToolsData.and.returnValue(of({ tools: {} }));
    
    component.ngOnInit();
    envChange$.next({});
    tick();
    
    expect(oldSub.unsubscribe).toHaveBeenCalled();
    expect(component.sseSub).not.toBe(oldSub);
  }));

  it('should navigate to environments when savedEnv is missing', fakeAsync(() => {
    localStorage.removeItem('environment');
    
    component.ngOnInit();
    envChange$.next({});
    tick();
    
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/environments']);
  }));

  it('should reset rowData when envValueChange$ emits', fakeAsync(() => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-change' }));
    component.rowData = [{ id: 1 }, { id: 2 }];
    toolsServiceSpy.liveToolsData.and.returnValue(of({ tools: {} }));
    
    component.ngOnInit();
    envChange$.next({});
    tick();
    
    expect(component.rowData).toEqual([]);
  }));

  it('getAvailableTools should return early when value is falsy', () => {
    const result = component.getAvailableTools(null);
    expect(result).toBeUndefined();
    expect(toolsServiceSpy.liveToolsData).not.toHaveBeenCalled();
  });

  it('getAvailableTools should return early when value is empty string', () => {
    const result = component.getAvailableTools('');
    expect(result).toBeUndefined();
  });

  it('getAvailableTools should unsubscribe existing sseSub before creating new one', () => {
    const oldSub = new Subscription();
    spyOn(oldSub, 'unsubscribe');
    component.sseSub = oldSub;
    toolsServiceSpy.liveToolsData.and.returnValue(of({ tools: {} }));
    
    component.getAvailableTools('env-123');
    
    expect(oldSub.unsubscribe).toHaveBeenCalled();
  });

  it('getAvailableTools should handle unsubscribe error gracefully', () => {
    const oldSub = new Subscription();
    spyOn(oldSub, 'unsubscribe').and.throwError('Unsubscribe error');
    component.sseSub = oldSub;
    toolsServiceSpy.liveToolsData.and.returnValue(of({ tools: {} }));
    
    expect(() => component.getAvailableTools('env-123')).not.toThrow();
  });

  it('getAvailableTools should map tools with icons', () => {
    const mockResponse = {
      tools: {
        t1: { _id: '1', name: 'MySQL', schemaId: 'mysql' },
        t2: { _id: '2', name: 'Postgres', schemaId: 'postgres' }
      }
    };
    toolsServiceSpy.liveToolsData.and.returnValue(of(mockResponse));
    spyOn(component, 'updateTools');
    
    component.getAvailableTools('env-123');
    
    expect(component.updateTools).toHaveBeenCalledWith([
      { _id: '1', name: 'MySQL', schemaId: 'mysql', icon: 'assets/images/icons/mysql.png' },
      { _id: '2', name: 'Postgres', schemaId: 'postgres', icon: 'assets/images/icons/postgresql.svg' }
    ]);
  });

  it('getAvailableTools should save tool names to localStorage', () => {
    const mockResponse = {
      tools: {
        t1: { _id: '1', name: 'MySQL', schemaId: 'mysql' }
      }
    };
    toolsServiceSpy.liveToolsData.and.returnValue(of(mockResponse));
    
    component.getAvailableTools('env-123');
    
    const stored = localStorage.getItem('availableTools');
    expect(stored).toBe(JSON.stringify(['MySQL']));
  });

  it('getAvailableTools should handle error and clear rowData', () => {
    toolsServiceSpy.liveToolsData.and.returnValue(throwError(() => new Error('API Error')));
    component.rowData = [{ id: 1 }];
    
    component.getAvailableTools('env-error');
    
    expect(component.rowData).toEqual([]);
  });

  it('openHost should open window with https URL', () => {
    spyOn(window, 'open');
    const params = { host: 'example.com' };
    
    component.openHost(params);
    
    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
  });

  it('openConfirmationDialog should handle cancellation', fakeAsync(() => {
    spyOn(console, 'log');
    const modalReturn = {
      componentInstance: {},
      result: Promise.resolve(false)
    } as any;
    modalSpy.open.and.returnValue(modalReturn);
    
    component.openConfirmationDialog();
    tick();
    
    expect(console.log).toHaveBeenCalledWith('Cancelled delete!');
    expect(toolsServiceSpy.deleteTools).not.toHaveBeenCalled();
  }));

  it('openConfirmationDialog should delete tool and navigate', fakeAsync(() => {
    component.envId = 'env-delete';
    component.toolName = 'MySQL';
    const modalReturn = {
      componentInstance: {},
      result: Promise.resolve(true)
    } as any;
    modalSpy.open.and.returnValue(modalReturn);
    toolsServiceSpy.deleteTools.and.returnValue(of({ success: true }));
    spyOn(component, 'getAvailableTools');
    
    component.openConfirmationDialog();
    tick();
    
    expect(toolsServiceSpy.deleteTools).toHaveBeenCalledWith('env-delete', 'MySQL');
    expect(toastrSpy.success).toHaveBeenCalledWith('Deleted Successfully');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tools']);
    expect(component.getAvailableTools).toHaveBeenCalledWith('env-delete');
    expect(component.isShowToolDetails).toBeFalse();
  }));

  it('getToolIcon should return cloudbeaver icon', () => {
    expect(component.getToolIcon('cloudbeaver')).toBe('assets/images/icons/cloudbeaver.png');
    expect(component.getToolIcon('CLOUDBEAVER')).toBe('assets/images/icons/cloudbeaver.png');
  });

  it('getToolIcon should return mysql icon', () => {
    expect(component.getToolIcon('mysql')).toBe('assets/images/icons/mysql.png');
    expect(component.getToolIcon('MySQL')).toBe('assets/images/icons/mysql.png');
  });

  it('getToolIcon should return postgres icon', () => {
    expect(component.getToolIcon('postgres')).toBe('assets/images/icons/postgresql.svg');
    expect(component.getToolIcon('POSTGRES')).toBe('assets/images/icons/postgresql.svg');
  });

  it('getToolIcon should return mongodb icon', () => {
    expect(component.getToolIcon('mongodb')).toBe('assets/images/icons/mongodb.svg');
    expect(component.getToolIcon('MongoDB')).toBe('assets/images/icons/mongodb.svg');
  });

  it('getToolIcon should return default icon for unknown tools', () => {
    expect(component.getToolIcon('unknown')).toBe('assets/images/icons/default-tool.png');
    expect(component.getToolIcon('redis')).toBe('assets/images/icons/default-tool.png');
  });

  it('updateTools should update existing tool when changes detected', () => {
    component.rowData = [
      { _id: '1', name: 'MySQL', status: 'running' }
    ];
    
    component.updateTools([
      { _id: '1', name: 'MySQL', status: 'stopped' }
    ]);
    
    expect(component.rowData[0].status).toBe('stopped');
  });

  it('updateTools should not update when no changes detected', () => {
    component.rowData = [
      { _id: '1', name: 'MySQL', status: 'running' }
    ];
    const original = component.rowData;
    
    component.updateTools([
      { _id: '1', name: 'MySQL', status: 'running' }
    ]);
    
    // Array reference should not change if no changes
    expect(component.rowData).toBe(original);
  });

  it('updateTools should add new tool', () => {
    component.rowData = [
      { _id: '1', name: 'MySQL' }
    ];
    
    component.updateTools([
      { _id: '2', name: 'Postgres' }
    ]);
    
    expect(component.rowData.length).toBe(2);
    expect(component.rowData[1].name).toBe('Postgres');
  });

  it('updateTools should create new array reference when changed', () => {
    component.rowData = [
      { _id: '1', name: 'MySQL' }
    ];
    const original = component.rowData;
    
    component.updateTools([
      { _id: '2', name: 'Postgres' }
    ]);
    
    expect(component.rowData).not.toBe(original);
  });

  it('updateTools should handle empty newTools array', () => {
    component.rowData = [{ _id: '1', name: 'MySQL' }];
    const original = component.rowData;
    
    component.updateTools([]);
    
    expect(component.rowData).toBe(original);
  });

  it('ngOnDestroy should clear interval', () => {
    spyOn(window, 'clearInterval');
    component.getToolsIntervel = 123;
    
    component.ngOnDestroy();
    
    expect(window.clearInterval).toHaveBeenCalledWith(123);
  });

  it('ngOnDestroy should handle undefined subscription', () => {
    component['subscription'] = undefined;
    component.sseSub = null;
    
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
