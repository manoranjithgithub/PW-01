import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditToolComponent } from './edit-tool.component';
import { ToolsService } from '../tools.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('EditToolComponent', () => {
  let component: EditToolComponent;
  let fixture: ComponentFixture<EditToolComponent>;
  let mockToolsService: any;
  let mockSharedService: any;
  let mockToastr: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockToolsService = jasmine.createSpyObj('ToolsService', ['getToolDetailsById', 'getInstanceTypes', 'updateTools']);
    mockSharedService = jasmine.createSpyObj('SharedService', ['envValueChange$', 'getCurrency', 'convertAmount']);
    mockToastr = jasmine.createSpyObj('ToastrService', ['success']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      queryParams: of({ id: 'tool123', selectedEdit: 'edit1' })
    };

    mockToolsService.getToolDetailsById.and.returnValue(of({
      data: {
        name: 'test-tool',
        schema: {},
        chart: 'chart1',
        version: '1.0',
        repository: 'repo1'
      }
    }));

    mockToolsService.getInstanceTypes.and.returnValue(of({ data: [] }));

    mockSharedService.envValueChange$ = of('envChanged');
    mockSharedService.getCurrency.and.returnValue('USD');
    mockSharedService.convertAmount.and.callFake((val: number) => val);

    TestBed.overrideComponent(EditToolComponent, {
      set: {
        providers: [{ provide: ToolsService, useValue: mockToolsService }]
      }
    });

    await TestBed.configureTestingModule({
      imports: [EditToolComponent, HttpClientTestingModule],
      providers: [
        FormBuilder,
        { provide: SharedService, useValue: mockSharedService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should read environment id from localStorage in constructor', () => {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'env-123' }));
    const comp = TestBed.createComponent(EditToolComponent).componentInstance;
    expect(comp.env).toBe('env-123');
  });
  it('should set resources as empty array when instance types data is invalid', fakeAsync(() => {
    mockToolsService.getInstanceTypes.and.returnValue(of({ data: null }));

    component.ngOnInit();
    tick();

    expect(component.resources).toEqual([]);
  }));

  it('should initialize tool details on ngOnInit', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(mockToolsService.getToolDetailsById).toHaveBeenCalled();
    expect(component.toolDetails.data.name).toBe('test-tool');
  }));

  it('should calculate hourly and monthly rates', () => {
    component.selectedResource = { cpuVcpu: '2', memoryGb: '4', instanceHourRate: 10 };
    expect(component.hourlyInstanceRate).toBe(10);
    expect(component.monthlyInstanceRate).toBe(7300);
  });

  it('should validate lowercase input', () => {
    const control: any = { value: 'lower-case' };
    expect(component['lowercaseValidator'](control)).toBeNull();
    control.value = 'UPPER';
    expect(component['lowercaseValidator'](control)).toEqual({ lowercase: true });
  });

  it('should toggle visibility', () => {
    component.hide['password'] = true;
    component.toggleVisibility('password');
    expect(component.hide['password']).toBeFalse();
    component.toggleVisibility('password');
    expect(component.hide['password']).toBeTrue();
  });

  it('should handle field change for instance type', () => {
    component.resources = [{ instanceType: 't2.small', cpuVcpu: '1', memoryGb: '2', instanceHourRate: 5 } as any];
    component.onFieldChange({ target: { value: 't2.small' } } as any, 'Instance Type');
    expect(component.selectedResource.cpuVcpu).toBe('1');
  });

  it('should format currency correctly', () => {
    const result = component.formatCurrency(100, 'USD');
    expect(result).toContain('$');
  });

  it('should sort instance types by price in ascending order', fakeAsync(() => {
    mockToolsService.getInstanceTypes.and.returnValue(of({
      data: [
        { instanceType: 'large', price: '$20' },
        { instanceType: 'small', price: '$5' },
        { instanceType: 'medium', instanceHourRate: '10' }
      ]
    }));

    component.ngOnInit();
    tick();

    expect(component.resources[0].instanceType).toBe('small');
    expect(component.resources[1].instanceType).toBe('medium');
    expect(component.resources[2].instanceType).toBe('large');
  }));

  it('should apply lowercase validator for name field', () => {
    const schema: any = {
      name: {
        key: 'name',
        type: 'text',
        label: 'Name',
        ui: true
      }
    };

    component.createForm(schema);

    const control = component.form.get('name');
    control?.setValue('INVALID');

    expect(control?.errors).toEqual({ lowercase: true });
  });
  it('should fallback to empty selectedResource when instance type not found', () => {
    component.resources = [];

    const schema: any = {
      instanceType: {
        key: 'instanceType',
        label: 'Instance Type',
        type: 'select',
        ui: true,
        value: 'unknown'
      }
    };

    component.createForm(schema);

    expect(component.selectedResource).toEqual({
      cpuVcpu: '',
      memoryGb: '',
      instanceHourRate: 0
    });
  });

  it('should set hide flag for password fields', () => {
    const schema: any = {
      password: {
        key: 'password',
        type: 'password',
        label: 'Password',
        ui: true
      }
    };

    component.createForm(schema);

    expect(component.hide['password']).toBeTrue();
  });

  it('should set selectedResource when Instance Type field is created', () => {
    component.resources = [
      { instanceType: 't2.micro', cpuVcpu: '1', memoryGb: '1', instanceHourRate: 2 }
    ];

    const schema: any = {
      instanceType: {
        key: 'instanceType',
        label: 'Instance Type',
        type: 'select',
        ui: true,
        value: 't2.micro'
      }
    };

    component.createForm(schema);

    expect(component.selectedResource.instanceHourRate).toBe(2);
  });
  it('should apply regex validator from field validation', () => {
    const schema: any = {
      username: {
        key: 'username',
        type: 'text',
        label: 'Username',
        ui: true,
        validation: {
          regex: '^[a-z]+$',
          error_message: 'Only lowercase allowed'
        }
      }
    };

    component.createForm(schema);

    const control = component.form.get('username');
    control?.setValue('INVALID123');

    expect(control?.errors).toEqual({ regex: 'Only lowercase allowed' });
  });

  it('should submit valid form', fakeAsync(() => {
    component.toolDetails = {
      data: { name: 'tool1', chart: 'chart1', version: '1', repository: 'repo1' }
    };
    component.form = component['fb'].group({
      name: ['tool1'],
      'mysql.primary.persistance.size': ['10']
    });
    mockToolsService.updateTools.and.returnValue(of({ status: true }));

    component.paramsEdit = 'edit1';
    component.onSubmit();
    tick();
    expect(mockToolsService.updateTools).toHaveBeenCalled();
    expect(mockToastr.success).toHaveBeenCalledWith('Updated successfully!');
  }));

  it('should not submit invalid form', () => {
    component.form = component['fb'].group({
      name: ['', Validators.required],
      'mysql.primary.persistance.size': ['10']
    });
    component.form.get('name')?.setValue('');
    component.form.get('name')?.markAsTouched();
    component.onSubmit();
    expect(component.submitted).toBeTrue();
    expect(mockToolsService.updateTools).not.toHaveBeenCalled();
  });

  it('should navigate to tools table', () => {
    component.showToolsTable();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tools']);
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component['subscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(component['subscription'].unsubscribe).toHaveBeenCalled();
  });
  it('should return null when control value is empty (regexValidator)', () => {
    const pattern = /^[0-9]+$/;
    const errorMessage = 'Only numbers allowed';

    const validatorFn = component.regexValidator(pattern, errorMessage);
    const control = new FormControl('');

    const result = validatorFn(control);

    expect(result).toBeNull();
  });
  it('should return error object when control value does not match regex', () => {
    const pattern = /^[a-z]+$/;
    const errorMessage = 'Only lowercase letters allowed';

    const validatorFn = component.regexValidator(pattern, errorMessage);
    const control = new FormControl('Invalid123');

    const result = validatorFn(control);

    expect(result).toEqual({ regex: errorMessage });
  });
  it('should return null when control value matches regex', () => {
    const pattern = /^[a-z]+$/;
    const errorMessage = 'Only lowercase letters allowed';

    const validatorFn = component.regexValidator(pattern, errorMessage);
    const control = new FormControl('validtext');

    const result = validatorFn(control);

    expect(result).toBeNull();
  });
  it('should return empty string for null value in formatCurrency', () => {
    expect(component.formatCurrency(null)).toBe('');
  });

  it('should return empty string for NaN value in formatCurrency', () => {
    expect(component.formatCurrency('abc')).toBe('');
  });
  it('should return string value if Intl.NumberFormat throws error', () => {
    spyOn(Intl, 'NumberFormat').and.throwError('Intl error');

    mockSharedService.convertAmount.and.returnValue(123);

    const result = component.formatCurrency(123);

    expect(result).toBe('123');
  });
  it('should use default_value when value is not provided', () => {
    const schema: any = {
      region: {
        key: 'region',
        type: 'text',
        label: 'Region',
        ui: true,
        default_value: 'us-east-1'
      }
    };

    component.createForm(schema);

    expect(component.form.get('region')?.value).toBe('us-east-1');
  });
  it('should fallback to USD when no currency is returned', () => {
    mockSharedService.getCurrency.and.returnValue(null);
    mockSharedService.convertAmount.and.returnValue(50);

    const result = component.formatCurrency(50);

    expect(result).toContain('$');
  });
  it('should add name field with update=true when viewdata.update is true', () => {
    component.toolDetails = { name: 'my-tool' } as any;
    component.viewdata = { update: true } as any;

    const schema: any = {
      cpu: { key: 'cpu', ui: true }
    };

    const result = component.addNameField(schema);

    expect(result.name).toBeDefined();
    expect(result.name.key).toBe('name');
    expect(result.name.type).toBe('text');
    expect(result.name.label).toBe('Name');
    expect(result.name.value).toBe('my-tool');
    expect(result.name.update).toBeTrue();
    expect(result.cpu).toBeDefined();
  });
  it('should fallback update=false when viewdata.update is not provided', () => {
    component.toolDetails = { name: 'fallback-tool' } as any;
    component.viewdata = {} as any;

    const result = component.addNameField({} as any);

    expect(result.name.value).toBe('fallback-tool');
    expect(result.name.update).toBeFalse();
  });

});
