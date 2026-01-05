import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfirmationModalComponent } from './confirmation-modal.component';

describe('ConfirmationModalComponent', () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    activeModalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModalSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input properties', () => {
    it('should initialize with default values', () => {
      expect(component.message).toBe('');
      expect(component.selectedItem).toBe('');
      expect(component.requireConfirmation).toBe(false);
      expect(component.confirmationWord).toBe('');
      expect(component.typedConfirmation).toBe('');
    });

    it('should accept custom input values', () => {
      component.message = 'Are you sure?';
      component.selectedItem = 'test-item';
      component.requireConfirmation = true;
      component.confirmationWord = 'DELETE';
      
      expect(component.message).toBe('Are you sure?');
      expect(component.selectedItem).toBe('test-item');
      expect(component.requireConfirmation).toBe(true);
      expect(component.confirmationWord).toBe('DELETE');
    });
  });

  describe('isConfirmationMatch()', () => {
    it('should return true when requireConfirmation is false', () => {
      component.requireConfirmation = false;
      component.typedConfirmation = '';
      component.confirmationWord = '';
      
      expect(component.isConfirmationMatch()).toBe(true);
    });

    it('should return true when typed confirmation matches exactly', () => {
      component.requireConfirmation = true;
      component.confirmationWord = 'DELETE';
      component.typedConfirmation = 'DELETE';
      
      expect(component.isConfirmationMatch()).toBe(true);
    });

    it('should return false when typed confirmation does not match', () => {
      component.requireConfirmation = true;
      component.confirmationWord = 'DELETE';
      component.typedConfirmation = 'delete';
      
      expect(component.isConfirmationMatch()).toBe(false);
    });

    it('should return false when typed confirmation is empty', () => {
      component.requireConfirmation = true;
      component.confirmationWord = 'DELETE';
      component.typedConfirmation = '';
      
      expect(component.isConfirmationMatch()).toBe(false);
    });

    it('should trim whitespace when comparing', () => {
      component.requireConfirmation = true;
      component.confirmationWord = '  DELETE  ';
      component.typedConfirmation = 'DELETE';
      
      expect(component.isConfirmationMatch()).toBe(true);
    });

    it('should handle null typed confirmation', () => {
      component.requireConfirmation = true;
      component.confirmationWord = 'DELETE';
      component.typedConfirmation = null as any;
      
      expect(component.isConfirmationMatch()).toBe(false);
    });

    it('should handle null confirmation word', () => {
      component.requireConfirmation = true;
      component.confirmationWord = null as any;
      component.typedConfirmation = 'DELETE';
      
      expect(component.isConfirmationMatch()).toBe(false);
    });
  });

  describe('confirm()', () => {
    describe('when requireConfirmation is false', () => {
      it('should close modal with true', () => {
        component.requireConfirmation = false;
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(true);
      });
    });

    describe('when requireConfirmation is true', () => {
      beforeEach(() => {
        component.requireConfirmation = true;
      });

      it('should close modal with true when confirmation matches (case-insensitive)', () => {
        component.confirmationWord = 'DELETE';
        component.typedConfirmation = 'delete';
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(true);
      });

      it('should close modal with true when confirmation matches exactly', () => {
        component.confirmationWord = 'DELETE';
        component.typedConfirmation = 'DELETE';
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(true);
      });

      it('should close modal with false when confirmation does not match', () => {
        component.confirmationWord = 'DELETE';
        component.typedConfirmation = 'REMOVE';
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(false);
      });

      it('should close modal with false when typed confirmation is empty', () => {
        component.confirmationWord = 'DELETE';
        component.typedConfirmation = '';
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(false);
      });

      it('should trim whitespace when comparing (case-insensitive)', () => {
        component.confirmationWord = '  DELETE  ';
        component.typedConfirmation = '  delete  ';
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(true);
      });

      it('should handle null typed confirmation', () => {
        component.confirmationWord = 'DELETE';
        component.typedConfirmation = null as any;
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(false);
      });

      it('should handle null confirmation word', () => {
        component.confirmationWord = null as any;
        component.typedConfirmation = 'DELETE';
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(false);
      });

      it('should handle both null values', () => {
        component.confirmationWord = null as any;
        component.typedConfirmation = null as any;
        
        component.confirm();
        
        expect(activeModalSpy.close).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('cancel()', () => {
    it('should close modal with false', () => {
      component.cancel();
      
      expect(activeModalSpy.close).toHaveBeenCalledWith(false);
    });

    it('should always close with false regardless of confirmation settings', () => {
      component.requireConfirmation = true;
      component.confirmationWord = 'DELETE';
      component.typedConfirmation = 'DELETE';
      
      component.cancel();
      
      expect(activeModalSpy.close).toHaveBeenCalledWith(false);
    });
  });

  describe('activeModal', () => {
    it('should have access to activeModal instance', () => {
      expect(component.activeModal).toBeDefined();
      expect(component.activeModal).toBe(activeModalSpy);
    });
  });
});
