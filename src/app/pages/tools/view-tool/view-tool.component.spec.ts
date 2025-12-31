import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ViewToolComponent } from './view-tool.component';
import { ToolsService } from '../tools.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ViewToolComponent', () => {
  let component: ViewToolComponent;
  let fixture: ComponentFixture<ViewToolComponent>;
  let toolsService: jasmine.SpyObj<ToolsService>;
  let sharedService: Partial<SharedService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: Partial<ActivatedRoute>;

  let queryParamsSubject: Subject<any>;

  beforeEach(async () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));

    queryParamsSubject = new Subject<any>();

    toolsService = jasmine.createSpyObj('ToolsService', ['getToolDetailsById', 'getInstanceTypes']);
    toolsService.getInstanceTypes.and.returnValue(of([
      { instanceType: 't2.micro', cpuVcpu: '1', memoryGb: '1', instanceHourRate: 1 }
    ]));
    toolsService.getToolDetailsById.and.returnValue(of({
      data: { name: 'tool1', schema: { field1: { ui: true, key: 'field1', type: 'text', help: '', children: [], depends_on: null, value: '' } } }
    }));

    router = jasmine.createSpyObj('Router', ['navigate']);
    const envChangeSubject = new Subject<any>();
    sharedService = {
      envValueChange$: envChangeSubject,
      getCurrency: () => 'USD',
      convertAmount: (value: number) => value
    };

    activatedRoute = { queryParams: queryParamsSubject };

    await TestBed.configureTestingModule({
      imports: [ViewToolComponent, HttpClientTestingModule],
      providers: [
        { provide: ToolsService, useValue: toolsService },
        { provide: SharedService, useValue: sharedService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ToastrService, useValue: jasmine.createSpyObj('ToastrService', ['error']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Component declares its own provider for ToolsService; override it so the
    // component receives our spy instance instead of a real service.
    TestBed.overrideComponent(ViewToolComponent as any, {
      set: {
        providers: [
          { provide: ToolsService, useValue: toolsService }
        ]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ViewToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  afterEach(() => {
    localStorage.clear();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle visibility', () => {
    const key = 'password';
    expect(component.hide[key]).toBeUndefined();
    component.toggleVisibility(key);
    expect(component.hide[key]).toBeTrue();
    component.toggleVisibility(key);
    expect(component.hide[key]).toBeFalse();
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(100);
    expect(formatted).toContain('$');
  });

  it('should open modal', () => {
    component.showToolsModel = jasmine.createSpyObj('ModalComponent', ['open', 'close']);
    component.showTools();
    expect(component.showToolsModel.open).toHaveBeenCalled();
  });

  it('should navigate to tools table', () => {
    component.showToolsTable();
    expect(router.navigate).toHaveBeenCalledWith(['/tools']);
  });

  it('should clean up subscription on destroy', () => {
    spyOn(component['subscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(component['subscription'].unsubscribe).toHaveBeenCalled();
  });

  it('should calculate monthlyInstanceRate from hourlyInstanceRate', () => {
    component.selectedResource = { instanceHourRate: 2 } as any;
    expect(component.monthlyInstanceRate).toBe(1460);
  });

  it('should build form with disabled controls from schema', fakeAsync(() => {
    // prepare a schema with multiple fields including instance type
    const schema = {
      fieldA: { ui: true, key: 'fieldA', type: 'text', label: 'A', value: 'valA', help: '', children: [], depends_on: null },
      instanceType: { ui: true, key: 'instanceType', type: 'text', label: 'Instance Type', value: 't2.micro', help: '', children: [], depends_on: null }
    } as any;

    // set resources to include the instance used
    component.resources = [{ instanceType: 't2.micro', cpuVcpu: '1', memoryGb: '1', instanceHourRate: 3 }];

    // call createForm and verify controls exist and are disabled
    component.createForm(schema);
    tick();
    expect(component.form.controls['fieldA']).toBeDefined();
    expect(component.form.controls['fieldA'].disabled).toBeTrue();
    expect(component.selectedResource.instanceHourRate).toBe(3);
  }));

  it('should populate toolDetails and create form on viewToolDetails', fakeAsync(() => {
    // spy on createForm and ensure service is called
    const createFormSpy = spyOn(component, 'createForm');
    component.selectedView = 'tool1';
    component.viewToolDetails();
    tick();
    expect(toolsService.getToolDetailsById).toHaveBeenCalledWith('env1', 'tool1');
    expect(createFormSpy).toHaveBeenCalled();
  }));

  it('should handle missing query params without throwing', fakeAsync(() => {
    // simulate missing/empty query params
    expect(() => {
      queryParamsSubject.next({});
      tick();
    }).not.toThrow();
  }));

  it('should propagate error when getToolDetailsById fails', fakeAsync(() => {
    toolsService.getToolDetailsById.and.returnValue(throwError(() => new Error('service-fail')));
    component.selectedView = 'tool1';
    expect(() => {
      component.viewToolDetails();
      tick();
    }).toThrowError('service-fail');
  }));
});
