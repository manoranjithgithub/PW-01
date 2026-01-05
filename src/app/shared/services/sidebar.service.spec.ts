import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have sidebarToggle$ observable', () => {
    expect(service.sidebarToggle$).toBeDefined();
  });

  it('hideSidebar should emit false through sidebarToggle$', (done) => {
    service.sidebarToggle$.subscribe(value => {
      expect(value).toBeFalse();
      done();
    });
    service.hideSidebar();
  });

  it('showSidebar should emit true through sidebarToggle$', (done) => {
    service.sidebarToggle$.subscribe(value => {
      expect(value).toBeTrue();
      done();
    });
    service.showSidebar();
  });

  it('setProject should store the project', () => {
    const project = { id: 'project-1', name: 'Test Project' };
    service.setProject(project);
    expect(service.hasSelectedProject()).toBeTrue();
  });

  it('hasSelectedProject should return false initially', () => {
    expect(service.hasSelectedProject()).toBeFalse();
  });

  it('hasSelectedProject should return true after setting a project', () => {
    service.setProject({ id: 'p1' });
    expect(service.hasSelectedProject()).toBeTrue();
  });

  it('hasSelectedProject should return false when project is null', () => {
    service.setProject(null);
    expect(service.hasSelectedProject()).toBeFalse();
  });

  it('hasSelectedProject should return false when project is undefined', () => {
    service.setProject(undefined);
    expect(service.hasSelectedProject()).toBeFalse();
  });

  it('should emit multiple sidebar toggle events in sequence', (done) => {
    const emissions: boolean[] = [];
    service.sidebarToggle$.subscribe(value => {
      emissions.push(value);
      if (emissions.length === 3) {
        expect(emissions).toEqual([true, false, true]);
        done();
      }
    });
    
    service.showSidebar();
    service.hideSidebar();
    service.showSidebar();
  });

  it('should handle setting different projects', () => {
    const project1 = { id: '1', name: 'Project 1' };
    const project2 = { id: '2', name: 'Project 2' };
    
    service.setProject(project1);
    expect(service.hasSelectedProject()).toBeTrue();
    
    service.setProject(project2);
    expect(service.hasSelectedProject()).toBeTrue();
  });

  it('should allow clearing project by setting null', () => {
    service.setProject({ id: 'test' });
    expect(service.hasSelectedProject()).toBeTrue();
    
    service.setProject(null);
    expect(service.hasSelectedProject()).toBeFalse();
  });

  it('sidebarToggle$ should support multiple subscribers', (done) => {
    let subscriber1Received = false;
    let subscriber2Received = false;
    
    service.sidebarToggle$.subscribe(value => {
      expect(value).toBeTrue();
      subscriber1Received = true;
      if (subscriber1Received && subscriber2Received) {
        done();
      }
    });
    
    service.sidebarToggle$.subscribe(value => {
      expect(value).toBeTrue();
      subscriber2Received = true;
      if (subscriber1Received && subscriber2Received) {
        done();
      }
    });
    
    service.showSidebar();
  });
});
