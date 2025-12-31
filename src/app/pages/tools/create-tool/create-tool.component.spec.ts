import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
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
    // provide envValueChange$ observable used in ngOnInit
    (sharedSpy as any).envValueChange$ = of({});

    const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    // set availableTools in localStorage for ngOnInit path
    localStorage.setItem('availableTools', JSON.stringify(['tool-a']));
    localStorage.setItem('environment', JSON.stringify({ id: 'env1' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj1' }));

    await TestBed.configureTestingModule({
      imports: [CreateToolComponent, HttpClientTestingModule],
      providers: [
        { provide: TOAST_CONFIG, useValue: {} },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: ToolsService, useValue: toolsSpy },
        { provide: SharedService, useValue: sharedSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (k: string) => null } }, params: of({}), queryParams: of({}) } }
      ]
    }).compileComponents();

    // override component provider so component uses our spy instance
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
    // mark form as invalid to avoid accessing undefined toolDetails
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
});
