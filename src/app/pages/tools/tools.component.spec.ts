import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolsComponent } from './tools.component';
import { ToolsService } from './tools.service';
import { SharedService } from '../../shared/services/shared.service';
import { PermissionService } from '../../shared/services/permission.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { of, Subject, Subscription } from 'rxjs';
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
});
