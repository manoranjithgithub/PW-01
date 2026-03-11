import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeploymentObservabilityComponent } from '../../deployments/deployment-observability/deployment-observability.component';

@Component({
  selector: 'app-tool-monitoring',
  standalone: true,
  imports: [CommonModule, DeploymentObservabilityComponent],
  templateUrl: './tool-monitoring.component.html',
  styleUrl: './tool-monitoring.component.scss'
})
export class ToolMonitoringComponent {
  @Input() toolName = '';
  @Input() toolDetails: any;

  get resolvedToolName(): string {
    return this.toolName || this.toolDetails?.data?.name || '';
  }
}
