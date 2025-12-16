import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss'
})
export class ConfirmationModalComponent {
  @Input() message: string = '';
  @Input() selectedItem: string = '';
  @Input() requireConfirmation: boolean = false;
  @Input() confirmationWord: string = '';

  typedConfirmation: string = '';

  isConfirmationMatch(): boolean {
    if (!this.requireConfirmation) return true;
    const typed = (this.typedConfirmation || '').trim();
    const expected = (this.confirmationWord || '').trim();
    return typed.length > 0 && typed === expected;
  }


  constructor(public activeModal: NgbActiveModal) { }

  confirm() {
    if (this.requireConfirmation) {
      // only confirm if typed confirmation matches (case-insensitive trim)
      if ((this.typedConfirmation || '').trim().toLowerCase() === (this.confirmationWord || '').trim().toLowerCase()) {
        this.activeModal.close(true);
      } else {
        this.activeModal.close(false);
      }
    } else {
      this.activeModal.close(true);
    }
  }

  cancel() {
    this.activeModal.close(false);
  }
}
