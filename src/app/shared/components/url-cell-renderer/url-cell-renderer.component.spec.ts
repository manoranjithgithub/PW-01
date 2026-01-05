import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UrlCellRendererComponent } from './url-cell-renderer.component';

describe('UrlCellRendererComponent', () => {
  let component: UrlCellRendererComponent;
  let fixture: ComponentFixture<UrlCellRendererComponent>;

  beforeEach(async () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'test-env' }));
    
    await TestBed.configureTestingModule({
      imports: [UrlCellRendererComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UrlCellRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.endpointStatus).toBeFalse();
    expect(component.region).toBe('ap-south-1');
    expect(component.envId).toBe('test-env');
  });

  it('should parse envId from localStorage', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'prod-env' }));
    const newComponent = new UrlCellRendererComponent();
    expect(newComponent.envId).toBe('prod-env');
  });

  it('should set envId to empty string when environment is not in localStorage', () => {
    localStorage.removeItem('environment');
    const newComponent = new UrlCellRendererComponent();
    expect(newComponent.envId).toBe('');
  });

  it('should set publicUrl when appIngressDomain is None', () => {
    const params = {
      data: {
        name: 'test-app',
        endpointStatus: 'accessible',
        network: {
          appIngressDomain: 'None'
        }
      }
    };

    component.agInit(params);

    expect(component.publicUrl).toBe('test-app - test-env.dev.ap-south-1.lb.nimbuz.tech');
    expect(component.endpointStatus).toBeTrue();
    expect(component.privateUrl).toBe('test-app');
  });

  it('should set publicUrl to customDomain when available', () => {
    const params = {
      data: {
        name: 'my-app',
        endpointStatus: 'not-accessible',
        network: {
          appIngressDomain: 'app.example.com',
          customDomain: 'custom.example.com'
        }
      }
    };

    component.agInit(params);

    expect(component.publicUrl).toBe('custom.example.com');
    expect(component.endpointStatus).toBeFalse();
    expect(component.privateUrl).toBe('my-app');
  });

  it('should set publicUrl to appIngressDomain when customDomain is not available', () => {
    const params = {
      data: {
        name: 'another-app',
        endpointStatus: 'accessible',
        network: {
          appIngressDomain: 'app.default.com'
        }
      }
    };

    component.agInit(params);

    expect(component.publicUrl).toBe('app.default.com');
    expect(component.endpointStatus).toBeTrue();
    expect(component.privateUrl).toBe('another-app');
  });

  it('should set publicUrl to null when appIngressDomain and customDomain are not available', () => {
    const params = {
      data: {
        name: 'no-domain-app',
        endpointStatus: 'accessible',
        network: {}
      }
    };

    component.agInit(params);

    expect(component.publicUrl).toBeNull();
    expect(component.endpointStatus).toBeTrue();
    expect(component.privateUrl).toBe('no-domain-app');
  });

  it('should set privateUrl to null when name is not available', () => {
    const params = {
      data: {
        endpointStatus: 'not-accessible',
        network: {
          appIngressDomain: 'test.com'
        }
      }
    };

    component.agInit(params);

    expect(component.publicUrl).toBe('test.com');
    expect(component.endpointStatus).toBeFalse();
    expect(component.privateUrl).toBeNull();
  });

  it('should set endpointStatus to true when status is accessible', () => {
    const params = {
      data: {
        name: 'app1',
        endpointStatus: 'accessible',
        network: {
          appIngressDomain: 'test.com'
        }
      }
    };

    component.agInit(params);

    expect(component.endpointStatus).toBeTrue();
  });

  it('should set endpointStatus to false when status is not accessible', () => {
    const params = {
      data: {
        name: 'app2',
        endpointStatus: 'not-accessible',
        network: {
          appIngressDomain: 'test.com'
        }
      }
    };

    component.agInit(params);

    expect(component.endpointStatus).toBeFalse();
  });

  it('should set endpointStatus to false when status is undefined', () => {
    const params = {
      data: {
        name: 'app3',
        network: {
          appIngressDomain: 'test.com'
        }
      }
    };

    component.agInit(params);

    expect(component.endpointStatus).toBeFalse();
  });

  it('should refresh and return false', () => {
    expect(component.refresh()).toBeFalse();
  });

  it('should handle network being undefined', () => {
    const params = {
      data: {
        name: 'app-no-network',
        endpointStatus: 'accessible'
      }
    };

    component.agInit(params);

    expect(component.publicUrl).toBeNull();
    expect(component.privateUrl).toBe('app-no-network');
  });

  it('should handle customDomain being null/undefined and use appIngressDomain', () => {
    const params = {
      data: {
        name: 'fallback-app',
        endpointStatus: 'accessible',
        network: {
          customDomain: null,
          appIngressDomain: 'fallback.domain.com'
        }
      }
    };

    component.agInit(params);

    expect(component.publicUrl).toBe('fallback.domain.com');
    expect(component.privateUrl).toBe('fallback-app');
  });

  it('should handle customDomain being empty string and use appIngressDomain', () => {
    const params = {
      data: {
        name: 'empty-custom-app',
        endpointStatus: 'accessible',
        network: {
          customDomain: '',
          appIngressDomain: 'empty.domain.com'
        }
      }
    };

    component.agInit(params);

    expect(component.publicUrl).toBe('empty.domain.com');
    expect(component.privateUrl).toBe('empty-custom-app');
  });
});
