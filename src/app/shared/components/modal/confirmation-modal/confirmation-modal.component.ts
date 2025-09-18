import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss'
})
export class ConfirmationModalComponent {
  @Input() message: string = '';
  @Input() selectedItem: string = '';

  constructor(public activeModal: NgbActiveModal) { }

  confirm() {
    this.activeModal.close(true);
  }

  cancel() {
    this.activeModal.close(false);
  }
}
