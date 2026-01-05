import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { LogViewerComponent } from './log-viewer.component';

describe('LogViewerComponent', () => {
  let component: LogViewerComponent;
  let fixture: ComponentFixture<LogViewerComponent>;

  const mockLogs = [
    { message: 'Error occurred in system', timestamp: '2023-01-01' },
    { message: 'Warning: Low memory', timestamp: '2023-01-02' },
    { message: 'Info: System started', timestamp: '2023-01-03' },
    { message: 'Debug: Connection established', timestamp: '2023-01-04' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize filterForm with empty searchText', () => {
      component.ngOnInit();
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('searchText')?.value).toBe('');
    });

    it('should filter logs when searchText changes', fakeAsync(() => {
      component.logs = mockLogs;
      component.ngOnInit();
      
      component.filterForm.get('searchText')?.setValue('Error');
      tick();
      
      expect(component.filteredLogs.length).toBe(1);
      expect(component.filteredLogs[0].message).toContain('Error');
    }));

    it('should filter logs case-insensitively', fakeAsync(() => {
      component.logs = mockLogs;
      component.ngOnInit();
      
      component.filterForm.get('searchText')?.setValue('error');
      tick();
      
      expect(component.filteredLogs.length).toBe(1);
      expect(component.filteredLogs[0].message).toContain('Error');
    }));

    it('should return all logs when search text is empty', fakeAsync(() => {
      component.logs = mockLogs;
      component.ngOnInit();
      
      component.filterForm.get('searchText')?.setValue('');
      tick();
      
      expect(component.filteredLogs.length).toBe(mockLogs.length);
    }));

    it('should handle null search text', fakeAsync(() => {
      component.logs = mockLogs;
      component.ngOnInit();
      
      component.filterForm.get('searchText')?.setValue(null);
      tick();
      
      expect(component.filteredLogs.length).toBe(mockLogs.length);
    }));
  });

  describe('ngOnChanges', () => {
    it('should update filteredLogs when logs change', () => {
      component.logs = mockLogs;
      const changes = {
        logs: new SimpleChange(null, mockLogs, true)
      };
      
      component.ngOnChanges(changes);
      
      expect(component.filteredLogs).toEqual(mockLogs);
    });

    it('should not update filteredLogs when logs is null', () => {
      const changes = {
        logs: new SimpleChange(null, null, true)
      };
      
      const previousFilteredLogs = component.filteredLogs;
      component.ngOnChanges(changes);
      
      expect(component.filteredLogs).toEqual(previousFilteredLogs);
    });

    it('should update currentPage when it changes (not first change)', () => {
      const changes = {
        currentPage: new SimpleChange(1, 2, false)
      };
      
      component.ngOnChanges(changes);
      
      expect(component.currentPage).toBe(2);
    });

    it('should not update currentPage on first change', () => {
      const changes = {
        currentPage: new SimpleChange(undefined, 1, true)
      };
      
      component.currentPage = 5;
      component.ngOnChanges(changes);
      
      expect(component.currentPage).toBe(5);
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call scrollToBottom after view init', fakeAsync(() => {
      spyOn(component, 'scrollToBottom');
      
      component.ngAfterViewInit();
      tick(0);
      
      expect(component.scrollToBottom).toHaveBeenCalled();
    }));
  });

  describe('scrollToBottom', () => {
    it('should scroll container to bottom', () => {
      const mockElement = {
        scrollHeight: 1000,
        scrollTo: jasmine.createSpy('scrollTo')
      };
      
      component.scrollContainer = {
        nativeElement: mockElement as any
      };
      
      component.scrollToBottom();
      
      expect(mockElement.scrollTo).toHaveBeenCalledWith({
        top: 1000,
        behavior: 'smooth'
      });
    });
  });

  describe('onPageChange', () => {
    it('should update currentPage and emit getLogs', () => {
      spyOn(component.getLogs, 'emit');
      component.itemsPerPage = 10;
      
      component.onPageChange(3);
      
      expect(component.currentPage).toBe(3);
      expect(component.getLogs.emit).toHaveBeenCalledWith({
        itemsPerPage: 10,
        currentPage: 3
      });
    });
  });

  describe('onChangePageSize', () => {
    it('should update itemsPerPage, reset currentPage to 1, and emit getLogs', () => {
      spyOn(component.getLogs, 'emit');
      const event = { target: { value: 20 } };
      component.currentPage = 5;
      
      component.onChangePageSize(event);
      
      expect(component.itemsPerPage).toBe(20);
      expect(component.currentPage).toBe(1);
      expect(component.getLogs.emit).toHaveBeenCalledWith({
        itemsPerPage: 20,
        currentPage: 1
      });
    });
  });

  describe('pages getter', () => {
    it('should return correct page numbers for middle pages', () => {
      component.totalItems = 10;
      component.currentPage = 5;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([3, 4, 5, 6, 7]);
    });

    it('should return correct page numbers for first pages', () => {
      component.totalItems = 10;
      component.currentPage = 1;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return correct page numbers for last pages', () => {
      component.totalItems = 10;
      component.currentPage = 10;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([6, 7, 8, 9, 10]);
    });

    it('should handle when total pages is less than maxSize', () => {
      component.totalItems = 3;
      component.currentPage = 2;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([1, 2, 3]);
    });

    it('should handle edge case when currentPage is at boundary', () => {
      component.totalItems = 10;
      component.currentPage = 2;
      component.maxSize = 5;
      
      const pages = component.pages;
      
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('onRefresh', () => {
    it('should emit getLogs with current settings and search text', () => {
      spyOn(component.getLogs, 'emit');
      component.itemsPerPage = 15;
      component.currentPage = 2;
      component.ngOnInit();
      component.filterForm.get('searchText')?.setValue('test search');
      
      component.onRefresh();
      
      expect(component.getLogs.emit).toHaveBeenCalledWith({
        itemsPerPage: 15,
        currentPage: 2,
        searchText: 'test search'
      });
    });

    it('should emit getLogs with empty searchText when not set', () => {
      spyOn(component.getLogs, 'emit');
      component.itemsPerPage = 10;
      component.currentPage = 1;
      component.ngOnInit();
      
      component.onRefresh();
      
      expect(component.getLogs.emit).toHaveBeenCalledWith({
        itemsPerPage: 10,
        currentPage: 1,
        searchText: ''
      });
    });

    it('should handle null searchText', () => {
      spyOn(component.getLogs, 'emit');
      component.itemsPerPage = 10;
      component.currentPage = 1;
      component.ngOnInit();
      component.filterForm.get('searchText')?.setValue(null);
      
      component.onRefresh();
      
      expect(component.getLogs.emit).toHaveBeenCalledWith({
        itemsPerPage: 10,
        currentPage: 1,
        searchText: ''
      });
    });
  });

  describe('Input properties', () => {
    it('should initialize with default values', () => {
      expect(component.logs).toEqual([]);
      expect(component.itemsPerPage).toBe(300);
      expect(component.pageSizes).toEqual([5, 10, 20]);
      expect(component.isLightMode).toBe(true);
      expect(component.totalItems).toBe(0);
      expect(component.currentPage).toBe(1);
    });

    it('should accept custom input values', () => {
      component.logs = mockLogs;
      component.itemsPerPage = 50;
      component.pageSizes = [10, 20, 50];
      component.isLightMode = false;
      component.totalItems = 100;
      component.currentPage = 3;
      
      expect(component.logs).toEqual(mockLogs);
      expect(component.itemsPerPage).toBe(50);
      expect(component.pageSizes).toEqual([10, 20, 50]);
      expect(component.isLightMode).toBe(false);
      expect(component.totalItems).toBe(100);
      expect(component.currentPage).toBe(3);
    });
  });
});
