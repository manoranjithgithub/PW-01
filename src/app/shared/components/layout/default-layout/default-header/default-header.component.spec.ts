import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../../../../core/services/auth.service';
import { SharedService } from '../../../../services/shared.service';
import { DefaultHeaderComponent } from './default-header.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('DefaultHeaderComponent', () => {
  let component: DefaultHeaderComponent;
  let fixture: ComponentFixture<DefaultHeaderComponent>;
  let mockAuthService: any;
  let mockSharedService: any;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['processDecodedToken', 'logout']);
    mockSharedService = jasmine.createSpyObj('SharedService', ['getUser', 'setCurrency', 'emitValueChange']);

    mockSharedService.getUser.and.returnValue({ name: 'John Doe', userName: 'jdoe' });

    await TestBed.configureTestingModule({
      imports: [DefaultHeaderComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: SharedService, useValue: mockSharedService },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}), snapshot: { params: {} } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize userData on ngOnInit', () => {
    component.ngOnInit();
    expect(mockAuthService.processDecodedToken).toHaveBeenCalled();
    expect(component.userData).toEqual({ name: 'John Doe', userName: 'jdoe' });
  });

  it('should change currency', () => {
    component.changeCurrency('INR');
    expect(component.selectedCurrency).toBe('INR');
    expect(mockSharedService.setCurrency).toHaveBeenCalledWith('INR');
  });

  it('should return initials from name', () => {
    component.userData = { name: 'John Doe' };
    expect(component.getInitials()).toBe('JD');

    component.userData = { userName: 'Alice' };
    expect(component.getInitials()).toBe('AL');

    component.userData = {};
    expect(component.getInitials()).toBe('');
  });

  it('should select region and set environments', () => {
    const region = {
      name: 'Region1',
      environments: [{ name: 'Env1' }, { name: 'Env2' }]
    };
    component.getSelectedRegion(region);
    expect(component.selectedRegion).toBe('Region1');
    expect(component.selectedEnvironment).toBe('Env1');
    expect(component.listOfenvironments.length).toBe(2);
  });

  it('should logout and reset color mode', () => {
    const setSpy = jasmine.createSpy('set');
    (component as any).colorMode = (() => 'light') as any;
    (component as any).colorMode.set = setSpy;

    component.logout();
    expect((component as any).colorMode.set).toHaveBeenCalledWith('light');
    expect(mockSharedService.emitValueChange).toHaveBeenCalledWith('light');
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should check selection functions', () => {
    component.selectedEnvironment = 'Env1';
    component.selectedRegion = 'Region1';
    component.selectedProject = 'Project1';

    expect(component.isSelectedEnv({ name: 'Env1' })).toBeTrue();
    expect(component.isSelectedRegion({ name: 'Region1' })).toBeTrue();
    expect(component.isSelectedProject({ name: 'Project1' })).toBeTrue();

    expect(component.isSelectedEnv({ name: 'Env2' })).toBeFalse();
    expect(component.isSelectedRegion({ name: 'Region2' })).toBeFalse();
    expect(component.isSelectedProject({ name: 'Project2' })).toBeFalse();
  });
});
