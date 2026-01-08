import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalCleanupService {

  private sseConnections: EventSource[] = [];
  private subscriptions: any[] = [];
  private timers: number[] = [];
  private gridApis: any[] = [];

  registerSSE(es: EventSource) {
    this.sseConnections.push(es);
  }

  registerSubscription(sub: any) {
    this.subscriptions.push(sub);
  }

  registerTimer(timerId: number) {
    this.timers.push(timerId);
  }

  registerGrid(api: any) {
    this.gridApis.push(api);
  }

  globalCleanup() {
    console.warn('[GlobalCleanup] Releasing memory...');

    this.sseConnections.forEach(es => es?.close());
    this.sseConnections = [];

    this.subscriptions.forEach(sub => sub?.unsubscribe?.());
    this.subscriptions = [];

    this.timers.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
    });
    this.timers = [];

    this.gridApis.forEach(api => {
      try {
        api?.setRowData?.([]);
        api?.destroy?.();
      } catch {}
    });
    this.gridApis = [];

    requestIdleCallback?.(() => {});

    console.warn('[GlobalCleanup] Memory released');
  }
}
