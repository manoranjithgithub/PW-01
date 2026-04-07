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

  get displaySelectedItem(): string {
    return this.selectedItem.toLowerCase() === 'deployment' ? 'Application' : this.selectedItem;
  }

  get confirmationPlaceholder(): string {
    if (this.selectedItem.toLowerCase() === 'project') {
      return 'Confirm project name here';
    } else if (this.selectedItem.toLowerCase() === 'environment') {
      return 'Confirm environment name here';
    }
    return 'Type confirmation word here';
  }

  get confirmationErrorMessage(): string {
    if (this.selectedItem.toLowerCase() === 'project') {
      return 'Project name does not match. Please enter the correct project name to confirm deletion.';
    } else if (this.selectedItem.toLowerCase() === 'environment') {
      return 'Environment name does not match. Please enter the correct environment name to confirm deletion.';
    }
    return 'Confirmation word does not match.';
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
