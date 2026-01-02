import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { CreateToolComponent } from './create-tool.component';
import { ToolsService } from '../tools.service';
import { SharedService } from '../../../shared/services/shared.service';
import { of } from 'rxjs';

describe('CreateToolComponent', () => {
  let component: CreateToolComponent;
  let fixture: ComponentFixture<CreateToolComponent>;
  let toolsSpy: jasmine.SpyObj<ToolsService>;
  let sharedSpy: jasmine.SpyObj<SharedService>;

  beforeEach(async () => {
    toolsSpy = jasmine.createSpyObj('ToolsService', ['getAvailableToolsList', 'getInstanceTypes', 'getFormDetailsByTool', 'createTools']);
    toolsSpy.getAvailableToolsList.and.returnValue(of({ data: {} }));
    toolsSpy.getInstanceTypes.and.returnValue(of({ data: [{ instanceType: 't1', instanceHourRate: 2 }] }));

    sharedSpy = jasmine.createSpyObj('SharedService', ['getCurrency', 'convertAmount']);
    sharedSpy.getCurrency.and.returnValue('USD');
    sharedSpy.convertAmount.and.returnValue(123);
    (sharedSpy as any).envValueChange$ = of({});

    const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    localStorage.setItem('availableTools', JSON.stringify(['tool-a']));
    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj1' }));

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [CreateToolComponent, HttpClientTestingModule],
      providers: [
        { provide: TOAST_CONFIG, useValue: {} },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: ToolsService, useValue: toolsSpy },
        { provide: SharedService, useValue: sharedSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (k: string) => null } }, params: of({}), queryParams: of({}) } }
      ]
    }).compileComponents();

    TestBed.overrideComponent(CreateToolComponent as any, {
      set: { providers: [{ provide: ToolsService, useValue: toolsSpy }] }
    });

    fixture = TestBed.createComponent(CreateToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('availableTools');
    localStorage.removeItem('environment');
    localStorage.removeItem('project');
  });

  it('should create form with validators and instance type default', () => {
    component.selectedTool = 'mysql';
    component.resources = [{ /* allow any */ } as any];

    const fields: any = {
      name: { ui: true, key: 'name', type: 'text', label: 'Name', default_value: '', validation: {} },
      'mysql.primary.persistance.size': { ui: true, key: 'mysql.primary.persistance.size', type: 'text', label: 'Size', default_value: '' },
      pwd: { ui: true, key: 'pwd', type: 'password', label: 'Password', default_value: '' },
      itype: { ui: true, key: 'itype', type: 'text', label: 'Instance Type', options: ['t1'] }
    };

    component.createForm(fields);
    expect(component.formStructure.length).toBeGreaterThan(0);
    expect(component.hide['pwd']).toBeTrue();
  });

  it('gigabyteValidator flags invalid values', () => {
    const res = (component as any).gigabyteValidator({ value: 'not-a-number' } as any);
    expect(res).toBeTruthy();
    const ok = (component as any).gigabyteValidator({ value: '12.5' } as any);
    expect(ok).toBeNull();
  });

  it('onSubmit invalid sets submitted flag', () => {
    component.form = component['fb'].group({ name: [''], other: [''] });
    component.form.setErrors({ invalid: true });
    component.onSubmit();
    expect(component.submitted).toBeTrue();
  });

  it('formatCurrency delegates to sharedService and formats', () => {
    const out = component.formatCurrency(10, 'USD');
    expect(sharedSpy.convertAmount).toHaveBeenCalled();
    expect(typeof out).toBe('string');
  });

  it('onImageClick loads details and calls install', fakeAsync(() => {
    const details = { data: { chart: 'c', version: 'v', repository: 'r', schema: {} } };
    toolsSpy.getFormDetailsByTool.and.returnValue(of({ data: details }));
    spyOn(component, 'install');
    component.onImageClick({ id: 'x' });
    tick();
    expect(toolsSpy.getFormDetailsByTool).toHaveBeenCalledWith('x');
    expect(component.install).toHaveBeenCalled();
  }));

  it('should initialize environment from localStorage', () => {
    expect(component.env).toBe('env1');
  });

  it('should set toolName from query params', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route as any).queryParams = of({ name: 'redis' });
    const newComponent = new CreateToolComponent(
      toolsSpy,
      route,
      TestBed.inject(Router) as any,
      TestBed.inject(FormBuilder),
      TestBed.inject(ToastrService),
      sharedSpy
    );
    expect(newComponent.toolName).toBe('redis');
  });

  it('should subscribe to envValueChange and navigate on change', fakeAsync(() => {
    const router = TestBed.inject(Router) as any;
    (sharedSpy as any).envValueChange$ = of('changed');
    component.ngOnInit();
    tick();
    expect(router.navigate).toHaveBeenCalledWith(['/tools']);
  }));

  it('should load available tools list on init', () => {
    expect(component.imgList).toBeDefined();
  });

  it('should load instance types on init', () => {
    expect(component.resources.length).toBeGreaterThan(0);
  });

  it('should load toolNames from localStorage', () => {
    expect(component.toolNames).toEqual(['tool-a']);
  });

  it('should handle empty availableTools in localStorage', () => {
    localStorage.removeItem('availableTools');
    const newFixture = TestBed.createComponent(CreateToolComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    expect(newComponent.toolNames).toEqual([]);
  });

  it('should validate regex pattern correctly', () => {
    const validator = component.regexValidator(/^[a-z]+$/, 'Only lowercase allowed');
    expect(validator({ value: 'abc' } as any)).toBeNull();
    expect(validator({ value: 'ABC' } as any)).toEqual({ regex: 'Only lowercase allowed' });
    expect(validator({ value: '' } as any)).toBeNull();
  });

  it('should validate unique name correctly', () => {
    component.toolNames = ['existing-tool', 'another-tool'];
    const validator = component.uniqueNameValidator(component.toolNames);
    expect(validator({ value: 'existing-tool' } as any)).toEqual({ uniqueName: true });
    expect(validator({ value: 'new-tool' } as any)).toBeNull();
    expect(validator({ value: '' } as any)).toBeNull();
  });

  it('should validate name does not contain mysql when selectedTool is mysql', () => {
    component.selectedTool = 'mysql';
    component.resources = [{ instanceType: 't1' }];
    const fields: any = {
      name: { ui: true, key: 'name', type: 'text', label: 'Name', default_value: '', validation: {} }
    };
    component.createForm(fields);
    component.form.get('name')?.setValue('my-mysql-db');
    expect(component.form.get('name')?.errors).toEqual({ forbiddenName: 'Name cannot include "mysql".' });
  });

  it('should validate name max length', () => {
    component.resources = [{ instanceType: 't1' }];
    const fields: any = {
      name: { ui: true, key: 'name', type: 'text', label: 'Name', default_value: '', validation: {} }
    };
    component.createForm(fields);
    component.form.get('name')?.setValue('this-is-a-very-long-name-that-exceeds-thirty-characters');
    expect(component.form.get('name')?.hasError('maxlength')).toBeTrue();
  });

  it('should add gigabyte validator for mysql persistence size', () => {
    const fb = TestBed.inject(FormBuilder);
    const control = fb.control('invalid');
    const result = (component as any).gigabyteValidator(control);
    expect(result).toBeTruthy();
    expect(result?.gigabyteValidator).toBeTrue();
  });

  it('should add gigabyte validator for postgresql persistence size', () => {
    const fb = TestBed.inject(FormBuilder);
    const control = fb.control('not-a-number');
    const result = (component as any).gigabyteValidator(control);
    expect(result).toBeTruthy();
    expect(result?.gigabyteValidator).toBeTrue();
  });

  it('should add gigabyte validator for mongodb persistence size', () => {
    const fb = TestBed.inject(FormBuilder);
    const control = fb.control('abc');
    const result = (component as any).gigabyteValidator(control);
    expect(result).toBeTruthy();
    expect(result?.gigabyteValidator).toBeTrue();
  });

  it('should add gigabyte validator for postgresql readReplicas persistence size', () => {
    const fb = TestBed.inject(FormBuilder);
    const control = fb.control('xyz');
    const result = (component as any).gigabyteValidator(control);
    expect(result).toBeTruthy();
    expect(result?.gigabyteValidator).toBeTrue();
  });

  it('should accept valid gigabyte values', () => {
    const validValues = ['10', '5.5', '100.25'];
    validValues.forEach(value => {
      const result = (component as any).gigabyteValidator({ value } as any);
      expect(result).toBeNull();
    });
  });

  it('should hide password fields', () => {
    component.resources = [{ instanceType: 't1' }];
    const fields: any = {
      password: { ui: true, key: 'password', type: 'password', label: 'Password', default_value: '' }
    };
    component.createForm(fields);
    expect(component.hide['password']).toBeTrue();
  });

  it('should toggle password visibility', () => {
    component.hide['mypass'] = true;
    component.toggleVisibility('mypass');
    expect(component.hide['mypass']).toBeFalse();
    component.toggleVisibility('mypass');
    expect(component.hide['mypass']).toBeTrue();
  });

  it('should set default value for Instance Type field', () => {
    component.resources = [
      { instanceType: 't1', cpuVcpu: '2', memoryGb: '4Gi', instanceHourRate: 0.5 },
      { instanceType: 't2', cpuVcpu: '4', memoryGb: '8Gi', instanceHourRate: 1.0 }
    ];
    const fields: any = {
      itype: { ui: true, key: 'itype', type: 'text', label: 'Instance Type', options: ['t1', 't2'], default_value: '' }
    };
    component.createForm(fields);
    expect((component.selectedResource as any).instanceType).toBe('t1');
    expect(component.selectedResource.instanceHourRate).toBe(0.5);
  });

  it('should update selectedResource on field change for Instance Type', () => {
    component.resources = [
      { instanceType: 't1', cpuVcpu: '2', memoryGb: '4Gi', instanceHourRate: 0.5 },
      { instanceType: 't2', cpuVcpu: '4', memoryGb: '8Gi', instanceHourRate: 1.5 }
    ];
    const event = { target: { value: 't2' } } as any;
    component.onFieldChange(event, 'Instance Type');
    expect((component.selectedResource as any).instanceType).toBe('t2');
    expect(component.selectedResource.instanceHourRate).toBe(1.5);
  });

  it('should not update selectedResource for non-Instance Type fields', () => {
    component.resources = [{ instanceType: 't1', instanceHourRate: 0.5 }];
    component.selectedResource = { instanceType: 't1', cpuVcpu: '2', memoryGb: '4Gi', instanceHourRate: 0.5 } as any;
    const event = { target: { value: 'some-value' } } as any;
    component.onFieldChange(event, 'Other Field');
    expect((component.selectedResource as any).instanceType).toBe('t1');
  });

  it('should calculate hourly instance rate', () => {
    component.selectedResource = { instanceType: 't1', cpuVcpu: '2', memoryGb: '4Gi', instanceHourRate: 2.5 } as any;
    expect(component.hourlyInstanceRate).toBe(2.5);
  });

  it('should calculate monthly instance rate', () => {
    component.selectedResource = { instanceType: 't1', cpuVcpu: '2', memoryGb: '4Gi', instanceHourRate: 1.0 } as any;
    expect(component.monthlyInstanceRate).toBe(730);
  });

  it('should return 0 for hourly rate when selectedResource is undefined', () => {
    component.selectedResource = { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 };
    expect(component.hourlyInstanceRate).toBe(0);
  });

  it('should onFieldBlur update name validation', () => {
    component.toolNames = ['existing'];
    component.resources = [{ instanceType: 't1' }];
    const fields: any = {
      name: { ui: true, key: 'name', type: 'text', label: 'Name', default_value: '', validation: {} }
    };
    component.createForm(fields);
    component.form.get('name')?.setValue('test-name');
    spyOn(component.form.get('name')!, 'updateValueAndValidity');
    component.onFieldBlur('name');
    expect(component.form.get('name')!.updateValueAndValidity).toHaveBeenCalled();
  });

  it('should add name field to schema', () => {
    component.toolDetails = { name: 'mytool' };
    const schema = { field1: { key: 'field1' } } as any;
    const result = component.addNameField(schema);
    expect(result.name).toBeDefined();
    expect(result.name.key).toBe('name');
    expect(result.name.value).toBe('mytool');
    expect(result.field1).toBeDefined();
  });

  it('should submit form with valid data', fakeAsync(() => {
    const toastr = TestBed.inject(ToastrService);
    const router = TestBed.inject(Router) as any;
    
    component.toolDetails = {
      chart: 'mysql-chart',
      version: '1.0.0',
      repository: 'helm-repo'
    };
    component.env = 'env1';
    component.form = component['fb'].group({
      name: ['test-tool'],
      'mysql.primary.persistence.size': ['10']
    });
    
    toolsSpy.createTools.and.returnValue(of({ status: 'success' }));
    
    component.onSubmit();
    tick();
    
    expect(toolsSpy.createTools).toHaveBeenCalled();
    const callArgs = toolsSpy.createTools.calls.mostRecent().args[0];
    expect(callArgs.name).toBe('test-tool');
    expect(callArgs.values['mysql.primary.persistence.size']).toBe('10Gi');
    expect(toastr.success).toHaveBeenCalledWith('Created successfully');
    expect(router.navigate).toHaveBeenCalledWith(['/tools']);
  }));

  it('should append Gi to postgresql persistence size fields on submit', fakeAsync(() => {
    component.toolDetails = { chart: 'pg', version: '1.0', repository: 'repo' };
    component.env = 'env1';
    component.form = component['fb'].group({
      name: ['pg-tool'],
      'postgresql.primary.persistence.size': ['20']
    });
    
    toolsSpy.createTools.and.returnValue(of({ status: 'success' }));
    
    component.onSubmit();
    tick();
    
    const callArgs = toolsSpy.createTools.calls.mostRecent().args[0];
    expect(callArgs.values['postgresql.primary.persistence.size']).toBe('20Gi');
  }));

  it('should append Gi to mongodb persistence size on submit', fakeAsync(() => {
    component.toolDetails = { chart: 'mongo', version: '1.0', repository: 'repo' };
    component.env = 'env1';
    component.form = component['fb'].group({
      name: ['mongo-tool'],
      'mongodb.persistence.size': ['15']
    });
    
    toolsSpy.createTools.and.returnValue(of({ status: 'success' }));
    
    component.onSubmit();
    tick();
    
    const callArgs = toolsSpy.createTools.calls.mostRecent().args[0];
    expect(callArgs.values['mongodb.persistence.size']).toBe('15Gi');
  }));

  it('should append Gi to postgresql readReplicas persistence size on submit', fakeAsync(() => {
    component.toolDetails = { chart: 'pg', version: '1.0', repository: 'repo' };
    component.env = 'env1';
    component.form = component['fb'].group({
      name: ['pg-replica'],
      'postgresql.readReplicas.persistence.size': ['25']
    });
    
    toolsSpy.createTools.and.returnValue(of({ status: 'success' }));
    
    component.onSubmit();
    tick();
    
    const callArgs = toolsSpy.createTools.calls.mostRecent().args[0];
    expect(callArgs.values['postgresql.readReplicas.persistence.size']).toBe('25Gi');
  }));

  it('should not submit when env is not set', () => {
    component.env = '';
    component.toolDetails = { chart: 'c', version: 'v', repository: 'r' };
    component.form = component['fb'].group({ name: ['test'] });
    component.form.markAllAsTouched();
    
    component.onSubmit();
    
    expect(toolsSpy.createTools).not.toHaveBeenCalled();
  });

  it('should install and prepare form', () => {
    component.toolDetails = {
      name: 'redis',
      schema: { field1: { key: 'field1', ui: true, type: 'text', label: 'Field 1', default_value: '' } }
    };
    component.resources = [{ instanceType: 't1' }];
    
    component.install();
    
    expect(component.isInstall).toBeFalse();
    expect(component.isShowForm).toBeTrue();
    expect(component.submitted).toBeFalse();
    expect(component.formStructure.length).toBeGreaterThan(0);
  });

  it('should navigate to tools list on showToolsTable', () => {
    const router = TestBed.inject(Router) as any;
    
    component.showToolsTable();
    
    expect(router.navigate).toHaveBeenCalledWith(['/tools']);
  });

  it('should reset isInstall and isShowForm on toolsListBack', () => {
    component.isInstall = false;
    component.isShowForm = true;
    
    component.toolsListBack();
    
    expect(component.isInstall).toBeTrue();
    expect(component.isShowForm).toBeFalse();
  });

  it('should format markdown data correctly', () => {
    const input = 'Line 1\\nLine 2\\n\\#Title';
    const result = component.getmarkData(input);
    expect(result).toBe('Line 1\nLine 2\n#Title');
  });

  it('should open tools modal with showTools', () => {
    (component as any).showToolsModel = { open: jasmine.createSpy('open'), close: jasmine.createSpy('close') };
    const details = { name: 'tool1' };
    
    component.showTools(details);
    
    expect(component.toolDetails).toBe(details);
    expect((component as any).showToolsModel.open).toHaveBeenCalled();
  });

  it('should close tools modal with closeTools', () => {
    (component as any).showToolsModel = { open: jasmine.createSpy('open'), close: jasmine.createSpy('close') };
    
    component.closeTools();
    
    expect((component as any).showToolsModel.close).toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    const subSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    (component as any).subscription = subSpy;
    
    component.ngOnDestroy();
    
    expect(subSpy.unsubscribe).toHaveBeenCalled();
  });

  it('should handle undefined subscription on destroy', () => {
    (component as any).subscription = undefined;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should format currency with null value', () => {
    const result = component.formatCurrency(null);
    expect(result).toBe('');
  });

  it('should format currency with NaN value', () => {
    const result = component.formatCurrency(NaN);
    expect(result).toBe('');
  });

  it('should format currency with conversion error', () => {
    sharedSpy.getCurrency.and.returnValue('INVALID');
    const result = component.formatCurrency(100, 'USD');
    expect(result).toBeTruthy();
  });

  it('should skip fields without ui property in createForm', () => {
    component.resources = [{ instanceType: 't1' }];
    const fields: any = {
      field1: { ui: true, key: 'field1', type: 'text', label: 'Field 1', default_value: '' },
      field2: { ui: false, key: 'field2', type: 'text', label: 'Field 2', default_value: '' }
    };
    
    component.createForm(fields);
    
    expect(component.form.get('field1')).toBeDefined();
    expect(component.form.get('field2')).toBeNull();
  });

  it('should handle validation regex from field config', () => {
    component.resources = [{ instanceType: 't1' }];
    const fields: any = {
      email: {
        ui: true,
        key: 'email',
        type: 'text',
        label: 'Email',
        default_value: '',
        validation: { regex: '^[a-z]+@[a-z]+\\.[a-z]+$', error_message: 'Invalid email' }
      }
    };
    
    component.createForm(fields);
    
    component.form.get('email')?.setValue('invalid');
    expect(component.form.get('email')?.errors).toEqual({ regex: 'Invalid email' });
    
    component.form.get('email')?.setValue('test@example.com');
    expect(component.form.get('email')?.valid).toBeTrue();
  });

  it('should handle missing selectedResource when calculating hourly rate', () => {
    component.selectedResource = undefined as any;
    expect(component.hourlyInstanceRate).toBe(0);
  });

  it('should handle onFieldBlur with empty fieldKey', () => {
    component.form = component['fb'].group({ name: ['test'] });
    expect(() => component.onFieldBlur('')).not.toThrow();
  });

  it('should get project ID from localStorage in onSubmit', fakeAsync(() => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj123' }));
    component.toolDetails = { chart: 'c', version: 'v', repository: 'r' };
    component.env = 'env1';
    component.form = component['fb'].group({ name: ['tool1'] });
    
    toolsSpy.createTools.and.returnValue(of({ status: 'success' }));
    
    component.onSubmit();
    tick();
    
    const callArgs = toolsSpy.createTools.calls.mostRecent().args[0];
    expect(callArgs.projectId).toBe('proj123');
  }));

  it('should handle missing project in localStorage', fakeAsync(() => {
    localStorage.removeItem('project');
    component.toolDetails = { chart: 'c', version: 'v', repository: 'r' };
    component.env = 'env1';
    component.form = component['fb'].group({ name: ['tool1'] });
    
    toolsSpy.createTools.and.returnValue(of({ status: 'success' }));
    
    component.onSubmit();
    tick();
    
    const callArgs = toolsSpy.createTools.calls.mostRecent().args[0];
    expect(callArgs.projectId).toBeUndefined();
  }));

  it('should only add fields that have ui: true to formStructure', () => {
    component.resources = [{ instanceType: 't1' }];
    const fields: any = {
      visible: { ui: true, key: 'visible', type: 'text', label: 'Visible', default_value: '' },
      hidden: { ui: false, key: 'hidden', type: 'text', label: 'Hidden', default_value: '' },
      noUi: { key: 'noUi', type: 'text', label: 'No UI', default_value: '' }
    };
    
    component.createForm(fields);
    
    const visibleInStructure = component.formStructure.some(f => f.key === 'visible');
    const hiddenInStructure = component.formStructure.some(f => f.key === 'hidden');
    const noUiInStructure = component.formStructure.some(f => f.key === 'noUi');
    
    expect(visibleInStructure).toBeTrue();
    expect(hiddenInStructure).toBeFalse();
    expect(noUiInStructure).toBeFalse();
  });

  it('should handle Instance Type field with empty options array', () => {
    component.resources = [{ instanceType: 't1', cpuVcpu: '2', memoryGb: '4Gi', instanceHourRate: 0.5 }];
    const fields: any = {
      itype: { ui: true, key: 'itype', type: 'text', label: 'Instance Type', options: [], default_value: '' }
    };
    
    expect(() => component.createForm(fields)).not.toThrow();
  });

  it('should not find resource when instance type not in resources array', () => {
    component.resources = [{ instanceType: 't1', cpuVcpu: '2', memoryGb: '4Gi', instanceHourRate: 0.5 }];
    const event = { target: { value: 'nonexistent' } } as any;
    
    component.onFieldChange(event, 'Instance Type');
    
    expect(component.selectedResource).toBeUndefined();
  });

  it('should handle empty environment in localStorage', () => {
    localStorage.removeItem('environment');
    const newFixture = TestBed.createComponent(CreateToolComponent);
    const newComponent = newFixture.componentInstance;
    expect(newComponent.env).toBe('');
  });
});
