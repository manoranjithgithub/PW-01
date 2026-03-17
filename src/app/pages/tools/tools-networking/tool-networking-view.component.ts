import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';

@Component({
  selector: 'app-tool-networking-view',
  standalone: true,
  imports: [CommonModule, SHARED_IMPORTS],
  templateUrl: './tool-networking-view.component.html',
  styleUrls: ['./tool-networking-view.component.scss']
})
export class ToolNetworkingViewComponent {
  @Input() viewdata: any;
  @Input() allowGenerate: boolean = false;
  @Output() generateHost = new EventEmitter<void>();

  copy(text?: string) {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const x = document.createElement('textarea');
      x.value = text;
      document.body.appendChild(x);
      x.select();
      document.execCommand('copy');
      document.body.removeChild(x);
    }
  }

  open(url?: string) {
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    window.open(href, '_blank');
  }

  requestGenerate() {
    this.generateHost.emit();
  }

  clearPublicHost() {
    if (this.viewdata && this.viewdata.data) {
      this.viewdata.data.publicHost = null;
    } else if (this.viewdata) {
      this.viewdata.publicHost = null;
    }
  }
}
