import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutActionService {
  private actionClickSource = new Subject<void>();
  actionClick$ = this.actionClickSource.asObservable();

  private extraTitleSubject = new BehaviorSubject<string | null>(null);
  extraTitle$ = this.extraTitleSubject.asObservable();

  triggerAction() {
    this.actionClickSource.next();
  }

  setExtraTitle(title: string) {
    this.extraTitleSubject.next(title);
  }

  clearExtraTitle() {
    this.extraTitleSubject.next(null);
  }
}
