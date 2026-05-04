import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ModalConfig } from './modal.config';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModalComponent implements OnInit {
  @Input() public modalConfig!: ModalConfig;
  @Input() public header: string = '';
  @Output() public modalClosed = new EventEmitter<void>();
  @ViewChild('modal') private modalContent!: TemplateRef<ModalComponent>;
  private modalRef!: NgbModalRef;

  constructor(public modalService: NgbModal, private sidebarService:SidebarService) { }
  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {

  }
  open(position?: string): void {
    if (!this.modalContent) {
      console.error('Modal content template is missing!');
      return;
    }
    const ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false,
      windowClass: position === 'right' ? 'modal-right' : 'modal-centered',
      size: undefined
    };
    this.modalRef = this.modalService.open(this.modalContent, ngbModalOptions,);
    // this.modalRef.result.then();
  }

  public close() {
    this.sidebarService.showSidebar();
    this.modalRef?.close();
    this.modalClosed.emit();
  }

  public dismiss() {
    // this.sidebarService.showSidebar();
    this.modalRef.dismiss();
    this.modalClosed.emit();
  }
}
