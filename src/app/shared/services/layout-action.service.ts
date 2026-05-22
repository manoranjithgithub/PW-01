import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutActionService {
  private actionClickSource = new Subject<string>();
  actionClick$ = this.actionClickSource.asObservable();

  private extraTitleSubject = new BehaviorSubject<string | null>(null);
  extraTitle$ = this.extraTitleSubject.asObservable();

  private actionStateSubject = new BehaviorSubject<any>(null);
  actionState$ = this.actionStateSubject.asObservable();

  triggerAction(action: string = 'delete') {
    this.actionClickSource.next(action);
  }

  setExtraTitle(title: string) {
    this.extraTitleSubject.next(title);
  }

  clearExtraTitle() {
    this.extraTitleSubject.next(null);
  }

  setActionState(state: any) {
    this.actionStateSubject.next(state);
  }

  clearActionState() {
    this.actionStateSubject.next(null);
  }
}
