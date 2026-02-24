import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';

import { AgGridTableComponent } from './ag-grid-table.component';
import { SharedService } from '../../services/shared.service';
import { of, Subject } from 'rxjs';

describe('AgGridTableComponent', () => {
  let component: AgGridTableComponent;
  let fixture: ComponentFixture<AgGridTableComponent>;
  let loadingSubject: Subject<boolean>;
  let sharedService: any;

  beforeEach(async () => {
    loadingSubject = new Subject<boolean>();

    sharedService = {
      isLoading$: loadingSubject.asObservable(),
      valueChange$: of('ag-theme-alpine')
    };

    await TestBed.configureTestingModule({
      imports: [AgGridTableComponent, HttpClientTestingModule],
      providers: [
        {
          provide: SharedService,
          useValue: sharedService
        },
        {
          provide: TOAST_CONFIG,
          useValue: {
            toastClass: 'toast',
            positionClass: 'toast-top-right',
            timeOut: 5000,
            extendedTimeOut: 1000,
            iconClasses: {
              error: 'toast-error',
              info: 'toast-info',
              success: 'toast-success',
              warning: 'toast-warning'
            }
          }
        },
        {
          provide: ToastrService,
          useValue: (window as any).jasmine?.createSpyObj
            ? (window as any).jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning'])
            : { success: () => { }, error: () => { }, info: () => { }, warning: () => { } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgGridTableComponent);
    component = fixture.componentInstance;
    (component as any).gridApi = {
      showNoRowsOverlay: jasmine.createSpy('showNoRowsOverlay'),
      hideOverlay: jasmine.createSpy('hideOverlay'),
      isDestroyed: () => false
    };

    fixture.detectChanges();
  });

  it('should capitalize first letter correctly and handle empty', () => {
    expect(component.capitalizeFirstLetter('word')).toBe('Word');
    expect(component.capitalizeFirstLetter('')).toBe('');
    expect(component.capitalizeFirstLetter(undefined as any)).toBe('');
  });

  it('should return project id from localStorage when JSON present', () => {
    localStorage.setItem('project', JSON.stringify({ id: 'proj-1' }));
    expect(component.getCurrentProjectId()).toBe('proj-1');
    localStorage.setItem('project', 'plain-id');
    expect(component.getCurrentProjectId()).toBe('plain-id');
    localStorage.removeItem('project');
  });

  it('onGridReady sets overlayMessage for billing', () => {
    component.tableName = 'billing';
    const fakeApi: any = {
      showNoRowsOverlay: jasmine.createSpy('showNoRowsOverlay'),
      hideOverlay: jasmine.createSpy('hideOverlay'),
      isDestroyed: () => false
    };
    component.onGridReady({ api: fakeApi } as any);
    expect(component.overlayMessage).toContain('billing');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should return environment id from localStorage', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-1' }));
    expect(component.getCurrentEnvId()).toBe('env-1');

    localStorage.setItem('environment', 'plain-env');
    expect(component.getCurrentEnvId()).toBe('plain-env');

    localStorage.removeItem('environment');
  });

  it('should show loading overlay when isLoading is true', () => {
    loadingSubject.next(true);

    expect(component.overlayMessage).toBe('');
    expect((component as any).gridApi.showNoRowsOverlay).toHaveBeenCalled();
  });
  it('should hide overlay when loading is false and rowData exists', () => {
    component.rowData = [{ id: 1 }];

    loadingSubject.next(false);

    expect(component.overlayMessage).toBe('');
    expect((component as any).gridApi.hideOverlay).toHaveBeenCalled();
  });
  it('should show no rows overlay when loading is false and no data', () => {
    component.rowData = [];
    component.tableName = 'tools';
    component.tablebtn = 'Tool';

    loadingSubject.next(false);

    expect(component.overlayMessage).toContain('You do not have');
    expect((component as any).gridApi.showNoRowsOverlay).toHaveBeenCalled();
  });
  it('should return noRowsTemplate with overlay message', () => {
    component.overlayMessage = 'No records found';
    expect(component.noRowsTemplate).toContain('No records found');
  });
  it('should emit add user event', () => {
    spyOn(component.addUuserEvent, 'emit');

    component.addNewUser();

    expect(component.addUuserEvent.emit).toHaveBeenCalledWith(true);
  });
  it('should return no rows template with overlay message', () => {
    component.overlayMessage = 'No data available';

    expect(component.noRowsTemplate)
      .toContain('No data available');
  });
});
