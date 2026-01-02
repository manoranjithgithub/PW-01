import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';

import { AgGridTableComponent } from './ag-grid-table.component';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('AgGridTableComponent', () => {
  let component: AgGridTableComponent;
  let fixture: ComponentFixture<AgGridTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgGridTableComponent, HttpClientTestingModule],
      providers: [
        {
          provide: TOAST_CONFIG,
          useValue: {
            toastClass: 'toast',
            positionClass: 'toast-top-right',
            timeOut: 5000,
            extendedTimeOut: 1000,
            iconClasses: { error: 'toast-error', info: 'toast-info', success: 'toast-success', warning: 'toast-warning' }
          }
        },
        { provide: ToastrService, useValue: (window as any).jasmine?.createSpyObj ? (window as any).jasmine.createSpyObj('ToastrService', ['success','error','info','warning']) : { success: () => {}, error: () => {}, info: () => {}, warning: () => {} } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgGridTableComponent);
    component = fixture.componentInstance;
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

  it('onGridReady sets overlayMessage for invoice-list', () => {
    component.tableName = 'invoice-list';
    const fakeApi: any = {
      showNoRowsOverlay: jasmine.createSpy('showNoRowsOverlay'),
      hideOverlay: jasmine.createSpy('hideOverlay'),
      isDestroyed: () => false
    };
    component.onGridReady({ api: fakeApi } as any);
    expect(component.overlayMessage).toContain('invoice-list');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
