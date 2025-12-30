import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditToolComponent } from './edit-tool.component';
import { ToolsService } from '../tools.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { FormBuilder, Validators } from '@angular/forms';
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

    // Ensure the standalone component uses our mock ToolsService instance
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
});
