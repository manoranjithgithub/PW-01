import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private sidebarToggleSubject = new Subject<boolean>();
  sidebarToggle$ = this.sidebarToggleSubject.asObservable();

  private selectedProject: any | null = null;

  hideSidebar() {
    this.sidebarToggleSubject.next(false);
  }

  showSidebar() {
    this.sidebarToggleSubject.next(true);
  }

  setProject(project: any) {
    this.selectedProject = project;
  }

  hasSelectedProject(): boolean {
    return this.selectedProject != null;
  }
}
