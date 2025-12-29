import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeployConfirmationComponent } from './deploy-confirmation.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('DeployConfirmationComponent', () => {
  let component: DeployConfirmationComponent;
  let fixture: ComponentFixture<DeployConfirmationComponent>;
  let mockActiveModal: any;

  beforeEach(async () => {
    mockActiveModal = jasmine.createSpyObj(['close']);

    await TestBed.configureTestingModule({
      declarations: [DeployConfirmationComponent],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should close modal with true on confirm', () => {
    component.confirm();
    expect(mockActiveModal.close).toHaveBeenCalledWith(true);
  });

  it('should close modal with false on cancel', () => {
    component.cancel();
    expect(mockActiveModal.close).toHaveBeenCalledWith(false);
  });

  it('should accept an input message', () => {
    component.message = 'Are you sure?';
    expect(component.message).toBe('Are you sure?');
  });
});
