import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-deploy-confirmation',
  standalone: true,
  imports: [NgIf],
  templateUrl: './deploy-confirmation.component.html',
  styleUrl: './deploy-confirmation.component.scss'
})
export class DeployConfirmationComponent {
  @Input() message: string = '';

  constructor(public activeModal: NgbActiveModal) { }

  get helperText(): string {
    const normalizedMessage = this.message.toLowerCase();

    if (normalizedMessage.includes('redeploy')) {
      return 'Redeploying will start a new deployment using your current source configuration.';
    }

    if (normalizedMessage.includes('tool') && normalizedMessage.includes('start')) {
      return 'The tool service will start running again and become available shortly.';
    }

    if (normalizedMessage.includes('tool') && normalizedMessage.includes('stop')) {
      return 'The tool service will pause and remain unavailable until you start it again.';
    }

    if (normalizedMessage.includes('resume')) {
      return 'Resuming the application will allow it to continue running normally.';
    }

    if (normalizedMessage.includes('cancel')) {
      return 'This will stop the process immediately and your latest changes will not be applied.';
    }

    return 'Pausing the deployment may cause temporary downtime or affect ongoing processes.';
  }

  confirm() {
    this.activeModal.close(true);
  }

  cancel() {
    this.activeModal.close(false);
  }
}
