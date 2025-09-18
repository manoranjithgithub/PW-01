import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { HighlightPipe } from '../../pipes/highlight.pipe';

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, HighlightPipe, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.scss'
})
export class LogViewerComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() logs: any[] = [];
  @Input() itemsPerPage = 300;
  @Input() pageSizes: number[] = [5, 10, 20];
  @Input() isLightMode = true;
  @Input() totalItems: number = 0;
  filteredLogs: any[] = [];
  maxSize = 5;

  @Input() currentPage: number = 1;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  filterForm!: FormGroup;

  @Output() getLogs = new EventEmitter<any>();
  constructor(private fb: FormBuilder) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['logs'] && changes['logs'].currentValue) {
      this.filteredLogs = this.logs;
      // this.scrollToBottom();
    }

    if (changes['currentPage'] && !changes['currentPage'].firstChange) {
      this.currentPage = changes['currentPage'].currentValue;
    }
  }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      searchText: ['']
    });
    this.filterForm.get('searchText')?.valueChanges.subscribe(search => {
      const keyword = (search || '').toLowerCase();
      this.filteredLogs = this.logs.filter(log =>
        log.message.toLowerCase().includes(keyword)
      );
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToBottom(), 0);
  }

  scrollToBottom(): void {
    const container = this.scrollContainer.nativeElement;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
  onPageChange(page: number) {
    console.log(page);
    this.currentPage = page;
    this.getLogs.emit({ itemsPerPage: this.itemsPerPage, currentPage: this.currentPage });
  }
  onChangePageSize(event: any) {
    this.itemsPerPage = event.target.value;
    this.currentPage = 1;
    this.getLogs.emit({ itemsPerPage: this.itemsPerPage, currentPage: this.currentPage });

  }

  get pages(): number[] {
    const total = this.totalItems;
    const max = this.maxSize;
    const current = this.currentPage;

    let start = Math.max(current - Math.floor(max / 2), 1);
    let end = start + max - 1;

    if (end > total) {
      end = total;
      start = Math.max(end - max + 1, 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onRefresh(): void {
    const searchText = this.filterForm.get('searchText')?.value || '';
    this.getLogs.emit({
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
      searchText
    });
  }
}
