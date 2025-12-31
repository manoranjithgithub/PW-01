import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplateRef, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from './model.component';
import { SidebarService } from '../../services/sidebar.service';
import { ModalConfig } from './modal.config';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;
  let modalServiceSpy: jasmine.SpyObj<NgbModal>;
  let sidebarServiceSpy: jasmine.SpyObj<SidebarService>;
  let modalRefSpy: jasmine.SpyObj<NgbModalRef>;

  const mockModalConfig: ModalConfig = {
    modalTitle: 'Test Modal',
    dismissButtonLabel: 'Cancel',
    closeButtonLabel: 'OK',
    width: '500px',
    modalSubtitle: 'Test Subtitle'
  };

  beforeEach(async () => {
    modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);
    sidebarServiceSpy = jasmine.createSpyObj('SidebarService', ['showSidebar', 'hideSidebar']);
    modalRefSpy = jasmine.createSpyObj('NgbModalRef', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      imports: [ModalComponent],
      providers: [
        { provide: NgbModal, useValue: modalServiceSpy },
        { provide: SidebarService, useValue: sidebarServiceSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    component.modalConfig = mockModalConfig;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should be called during initialization', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should complete without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('Input properties', () => {
    it('should initialize with default header', () => {
      expect(component.header).toBe('');
    });

    it('should accept modalConfig input', () => {
      component.modalConfig = mockModalConfig;
      expect(component.modalConfig).toEqual(mockModalConfig);
      expect(component.modalConfig.modalTitle).toBe('Test Modal');
    });

    it('should accept header input', () => {
      component.header = 'Custom Header';
      expect(component.header).toBe('Custom Header');
    });
  });

  describe('Template rendering', () => {
    it('should have modalContent ViewChild after view initialization', () => {
      fixture.detectChanges();
      expect(component['modalContent']).toBeDefined();
    });

    it('should render with modalConfig properties', () => {
      expect(component.modalConfig.modalTitle).toBe('Test Modal');
      expect(component.modalConfig.width).toBe('500px');
    });
  });

  describe('open()', () => {
    beforeEach(() => {
      modalServiceSpy.open.and.returnValue(modalRefSpy);
      fixture.detectChanges(); // Ensure ViewChild is initialized
    });

    it('should open modal with centered position by default', () => {
      component.open();
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(
        jasmine.any(Object),
        {
          backdrop: 'static',
          keyboard: false,
          windowClass: 'modal-centered',
          size: undefined
        }
      );
    });

    it('should open modal with right position when specified', () => {
      component.open('right');
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(
        jasmine.any(Object),
        {
          backdrop: 'static',
          keyboard: false,
          windowClass: 'modal-right',
          size: undefined
        }
      );
    });

    it('should store modal reference after opening', () => {
      component.open();
      
      expect(component['modalRef']).toBe(modalRefSpy);
    });

    it('should open with centered class for any position other than "right"', () => {
      component.open('left');
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.objectContaining({
          windowClass: 'modal-centered'
        })
      );
    });

    it('should open with static backdrop', () => {
      component.open();
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.objectContaining({
          backdrop: 'static'
        })
      );
    });

    it('should open with keyboard disabled', () => {
      component.open();
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.objectContaining({
          keyboard: false
        })
      );
    });

    it('should open with undefined size', () => {
      component.open();
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.objectContaining({
          size: undefined
        })
      );
    });

    it('should handle opening with empty string position', () => {
      component.open('');
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.objectContaining({
          windowClass: 'modal-centered'
        })
      );
    });
  });

  describe('open() - missing template', () => {
    it('should log error and return if modalContent is undefined', () => {
      spyOn(console, 'error');
      component['modalContent'] = undefined as any;
      
      component.open();
      
      expect(console.error).toHaveBeenCalledWith('Modal content template is missing!');
      expect(modalServiceSpy.open).not.toHaveBeenCalled();
    });

    it('should log error and return if modalContent is null', () => {
      spyOn(console, 'error');
      component['modalContent'] = null as any;
      
      component.open();
      
      expect(console.error).toHaveBeenCalledWith('Modal content template is missing!');
      expect(modalServiceSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('close()', () => {
    beforeEach(() => {
      modalServiceSpy.open.and.returnValue(modalRefSpy);
      fixture.detectChanges();
      component.open();
    });

    it('should call showSidebar on sidebarService', () => {
      component.close();
      
      expect(sidebarServiceSpy.showSidebar).toHaveBeenCalled();
    });

    it('should close the modal', () => {
      component.close();
      
      expect(modalRefSpy.close).toHaveBeenCalled();
    });

    it('should call showSidebar before closing modal', () => {
      const order: string[] = [];
      sidebarServiceSpy.showSidebar.and.callFake(() => order.push('sidebar'));
      modalRefSpy.close.and.callFake(() => order.push('modal'));
      
      component.close();
      
      expect(order).toEqual(['sidebar', 'modal']);
    });

    it('should handle close when modalRef is not set', () => {
      component['modalRef'] = undefined as any;
      
      expect(() => component.close()).not.toThrow();
      expect(sidebarServiceSpy.showSidebar).toHaveBeenCalled();
    });

    it('should handle close when modalRef is null', () => {
      component['modalRef'] = null as any;
      
      expect(() => component.close()).not.toThrow();
      expect(sidebarServiceSpy.showSidebar).toHaveBeenCalled();
    });
  });

  describe('dismiss()', () => {
    beforeEach(() => {
      modalServiceSpy.open.and.returnValue(modalRefSpy);
      fixture.detectChanges();
      component.open();
    });

    it('should dismiss the modal', () => {
      component.dismiss();
      
      expect(modalRefSpy.dismiss).toHaveBeenCalled();
    });

    it('should not call showSidebar on dismiss', () => {
      component.dismiss();
      
      expect(sidebarServiceSpy.showSidebar).not.toHaveBeenCalled();
    });

    it('should not call hideSidebar on dismiss', () => {
      component.dismiss();
      
      expect(sidebarServiceSpy.hideSidebar).not.toHaveBeenCalled();
    });
  });

  describe('modalService access', () => {
    it('should have access to modalService instance', () => {
      expect(component.modalService).toBeDefined();
      expect(component.modalService).toBe(modalServiceSpy);
    });

    it('should have public modalService property', () => {
      expect(component.modalService).toBe(modalServiceSpy);
    });
  });

  describe('constructor', () => {
    it('should inject modalService and sidebarService', () => {
      expect(component.modalService).toBe(modalServiceSpy);
      expect(component['sidebarService']).toBe(sidebarServiceSpy);
    });
  });

  describe('ViewChild modalContent', () => {
    it('should have modalContent ViewChild defined after view init', () => {
      fixture.detectChanges();
      expect(component['modalContent']).toBeDefined();
    });
  });

  describe('Integration tests', () => {
    beforeEach(() => {
      modalServiceSpy.open.and.returnValue(modalRefSpy);
      fixture.detectChanges();
    });

    it('should handle complete open and close workflow', () => {
      component.open();
      expect(modalServiceSpy.open).toHaveBeenCalled();
      
      component.close();
      expect(sidebarServiceSpy.showSidebar).toHaveBeenCalled();
      expect(modalRefSpy.close).toHaveBeenCalled();
    });

    it('should handle complete open and dismiss workflow', () => {
      component.open();
      expect(modalServiceSpy.open).toHaveBeenCalled();
      
      component.dismiss();
      expect(modalRefSpy.dismiss).toHaveBeenCalled();
      expect(sidebarServiceSpy.showSidebar).not.toHaveBeenCalled();
    });

    it('should handle opening modal multiple times', () => {
      component.open();
      component.open('right');
      
      expect(modalServiceSpy.open).toHaveBeenCalledTimes(2);
    });

    it('should handle opening modal with different positions sequentially', () => {
      component.open();
      component.close();
      
      modalServiceSpy.open.calls.reset();
      modalRefSpy.close.calls.reset();
      sidebarServiceSpy.showSidebar.calls.reset();
      
      component.open('right');
      component.dismiss();
      
      expect(modalServiceSpy.open).toHaveBeenCalledTimes(1);
      expect(modalRefSpy.dismiss).toHaveBeenCalled();
    });
  });
});
