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
  @Input() readOnlyMode: boolean = false;
  @Output() generateHost = new EventEmitter<void>();

  private get data(): any {
    return this.viewdata?.data || this.viewdata || {};
  }

  private get portsList(): any[] {
    const rawPorts = this.data?.ports;
    if (Array.isArray(rawPorts)) return rawPorts;
    return rawPorts ? [rawPorts] : [];
  }

  private getPortValues(kind: 'publicPort' | 'privatePort'): Array<string | number> {
    return this.portsList
      .map((port: any) => port?.[kind])
      .filter((value: any) => value !== undefined && value !== null);
  }

  get publicPortValues(): Array<string | number> {
    return this.getPortValues('publicPort');
  }

  get privatePortValues(): Array<string | number> {
    return this.getPortValues('privatePort');
  }

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

  copyPortWithFeedback(event: MouseEvent, text?: string) {
    if (!text) return;
    this.copy(text);
    const btn = event.currentTarget as HTMLElement | null;
    if (!btn) return;
    btn.setAttribute('title', 'Copied');
    btn.classList.remove('show-copied-tip');
    void btn.offsetWidth;
    btn.classList.add('show-copied-tip');
    setTimeout(() => {
      btn.setAttribute('title', 'Copy');
      btn.classList.remove('show-copied-tip');
    }, 1200);
  }

  open(url?: string) {
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    window.open(href, '_blank');
  }

  requestGenerate() {
    if (this.readOnlyMode) return;
    this.generateHost.emit();
  }

  clearPublicHost() {
    if (this.readOnlyMode) return;
    if (this.viewdata && this.viewdata.data) {
      this.viewdata.data.publicHost = null;
    } else if (this.viewdata) {
      this.viewdata.publicHost = null;
    }
  }
}
