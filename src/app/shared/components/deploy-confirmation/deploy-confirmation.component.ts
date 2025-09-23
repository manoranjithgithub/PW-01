import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-deploy-confirmation',
  standalone: true,
  imports: [],
  templateUrl: './deploy-confirmation.component.html',
  styleUrl: './deploy-confirmation.component.scss'
})
export class DeployConfirmationComponent {
  @Input() message: string = '';

  constructor(public activeModal: NgbActiveModal) { }

  confirm() {
    this.activeModal.close(true);
  }

  cancel() {
    this.activeModal.close(false);
  }
}
