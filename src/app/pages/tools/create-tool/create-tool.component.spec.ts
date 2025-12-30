import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateToolComponent } from './create-tool.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { ToolsService } from '../tools.service';
import { of, Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CreateToolComponent', () => {
  let component: CreateToolComponent;
  let fixture: ComponentFixture<CreateToolComponent>;
  let toolsService: jasmine.SpyObj<ToolsService>;
  let router: jasmine.SpyObj<Router>;
  let toastr: jasmine.SpyObj<ToastrService>;
  let sharedService: any;

  const envSubject = new Subject<any>();

  beforeEach(async () => {
    toolsService = jasmine.createSpyObj('ToolsService', [
      'getAvailableToolsList',
      'getInstanceTypes',
      'getFormDetailsByTool',
      'createTools'
    ]);

    router = jasmine.createSpyObj('Router', ['navigate']);
    toastr = jasmine.createSpyObj('ToastrService', ['success']);

    sharedService = {
      envValueChange$: envSubject.asObservable(),
      getCurrency: jasmine.createSpy().and.returnValue('USD'),
      convertAmount: jasmine.createSpy().and.callFake((v: number) => v),
    };

    await TestBed.configureTestingModule({
      imports: [CreateToolComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        FormBuilder,
        { provide: ToolsService, useValue: toolsService },
        { provide: Router, useValue: router },
        { provide: ToastrService, useValue: toastr },
        { provide: SharedService, useValue: sharedService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ name: 'mysql' })
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateToolComponent);
    component = fixture.componentInstance;

    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj1' }));
    localStorage.setItem('availableTools', JSON.stringify(['tool1']));

    toolsService.getAvailableToolsList.and.returnValue(of({ data: { a: {} } }));
    toolsService.getInstanceTypes.and.returnValue(of({
      data: [
        { instanceType: 't2.micro', cpuVcpu: '1', memoryGb: '1', instanceHourRate: 1 }
      ]
    }));

    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize data on ngOnInit', () => {
    spyOn(component['http'], 'getAvailableToolsList')
      .and.returnValue(of({ data: { a: {} } }));

    spyOn(component['http'], 'getInstanceTypes')
      .and.returnValue(of({
        data: [
          {
            instanceType: 't2.micro',
            cpuVcpu: '1',
            memoryGb: '1',
            instanceHourRate: 1
          }
        ]
      }));

    component.ngOnInit();

    expect(component['http'].getAvailableToolsList).toHaveBeenCalled();
    expect(component['http'].getInstanceTypes).toHaveBeenCalled();

    expect(component.imgList.length).toBe(1);
    expect(component.resources.length).toBe(1);
  });

  it('should navigate on env change', () => {
    envSubject.next('changed');
    expect(router.navigate).toHaveBeenCalledWith(['/tools']);
  });

  it('should create form with validators', () => {
    component.selectedTool = 'mysql';

    const schema: any = {
      name: {
        key: 'name',
        ui: true,
        label: 'Name',
        default_value: '',
        validation: {},
        type: 'text'
      }
    };

    component.createForm(schema);
    const control = component.form.get('name');

    control?.setValue('mysql-test');
    expect(control?.errors).toEqual(jasmine.objectContaining({ forbiddenName: jasmine.any(String) }));
  });

  it('should validate gigabyte field', () => {
    const control: any = { value: '10GB' };
    const result = (component as any).gigabyteValidator(control);
    expect(result).toEqual({ gigabyteValidator: true });
  });

  it('should toggle password visibility', () => {
    component.hide['pwd'] = true;
    component.toggleVisibility('pwd');
    expect(component.hide['pwd']).toBeFalse();
  });

  it('should handle install()', () => {
    component.toolDetails = {
      name: 'tool',
      schema: {}
    };

    spyOn(component, 'createForm');
    component.install();

    expect(component.isInstall).toBeFalse();
    expect(component.isShowForm).toBeTrue();
    expect(component.createForm).toHaveBeenCalled();
  });

  it('should handle onImageClick()', () => {
    spyOn(component['http'], 'getFormDetailsByTool')
      .and.returnValue(of({
        data: {
          schema: {},
          chart: 'chart',
          version: '1',
          repository: 'repo'
        }
      }));

    spyOn(component, 'install');
    component.onImageClick({ id: 1 });

    expect(component['http'].getFormDetailsByTool).toHaveBeenCalledWith(1);
    expect(component.install).toHaveBeenCalled();
  });


  it('should submit form successfully', () => {

    component.env = 'env1';

    component.toolDetails = {
      chart: 'chart',
      version: '1.0.0',
      repository: 'repo'
    };

    component.form = new FormBuilder().group({
      name: ['tool-name', Validators.required],
      'mongodb.persistence.size': ['10', Validators.required]
    });

    spyOn(component['http'], 'createTools')
      .and.returnValue(of({ status: true }));

    expect(component.form.valid).toBeTrue();
    expect(component.env).toBeTruthy();

    component.onSubmit();

    expect(component['http'].createTools).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalledWith('Created successfully');
    expect(router.navigate).toHaveBeenCalledWith(['/tools']);
  });




  it('should mark submitted when form invalid', () => {
    component.toolDetails = {
      chart: 'chart',
      version: '1',
      repository: 'repo'
    };

    component.form = new FormBuilder().group({
      name: ['', Validators.required]
    });
    expect(component.form.valid).toBeFalse();
    component.onSubmit();
    expect(component.submitted).toBeTrue();
  });



  it('should return hourly and monthly rates', () => {
    component.selectedResource = { instanceHourRate: 2 } as any;
    expect(component.hourlyInstanceRate).toBe(2);
    expect(component.monthlyInstanceRate).toBe(1460);
  });

  it('should format currency', () => {
    const result = component.formatCurrency(100);
    expect(result).toContain('$');
  });

  it('should cleanup subscription on destroy', () => {
    spyOn(component['subscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(component['subscription'].unsubscribe).toHaveBeenCalled();
  });
});
