// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService, TOAST_CONFIG } from 'ngx-toastr';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';

// Provide a robust canvas context stub for headless/chart tests.
// Chart.js uses several 2D context APIs; create a forgiving stub that
// implements commonly-used methods and returns safe defaults.
try {
  if (typeof HTMLCanvasElement !== 'undefined') {
    const safeContext = () => {
      const ctx: any = {
        // drawing
        fillRect: () => {},
        clearRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        bezierCurveTo: () => {},
        quadraticCurveTo: () => {},
        arc: () => {},
        rect: () => {},
        fill: () => {},
        stroke: () => {},
        fillText: () => {},
        measureText: () => ({ width: 0 }),
        // transforms
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        setTransform: () => {},
        transform: () => {},
        resetTransform: () => {},
        // state
        save: () => {},
        restore: () => {},
        // images
        drawImage: () => {},
        createImageData: () => ({ width: 0, height: 0, data: [] }),
        getImageData: (_: any, __: any, ___: any, ____: any) => ({ data: [] }),
        putImageData: () => {},
        // paths
        isPointInPath: () => false,
        // style
        setLineDash: () => {},
        getLineDash: () => [],
        // gradients/patterns
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createPattern: () => ({}),
        // canvas metadata
        canvas: { width: 300, height: 150 },
      };
      return ctx;
    };

    (HTMLCanvasElement.prototype as any).getContext = (HTMLCanvasElement.prototype as any).getContext || function(type?: string) {
      // Chart.js asks for '2d' contexts; return safe stub for those.
      if (!type || type === '2d') return safeContext();
      return null;
    };
  }
} catch (e) {
  // Ignore in environments where HTMLCanvasElement isn't available.
}

// CRITICAL: Stub window.location BEFORE initializing Angular test environment
// Prevent ALL page reloads by intercepting at multiple levels
(function() {
  const _origLocation = window.location;
  
  // Create a complete fake location that mimics the real one
  const fakeLocation = {
    reload: function() { /* no-op */ },
    assign: function(url: string) { /* no-op */ },
    replace: function(url: string) { /* no-op */ },
    toString: function() { return _origLocation.href; },
    _href: _origLocation.href,
    get href() { return this._href; },
    set href(v: string) { this._href = v; /* no-op assignment */ },
    origin: _origLocation.origin,
    protocol: _origLocation.protocol,
    host: _origLocation.host,
    hostname: _origLocation.hostname,
    port: _origLocation.port,
    pathname: _origLocation.pathname,
    search: _origLocation.search,
    hash: _origLocation.hash
  };

  // Replace window.location completely
  try {
    delete (window as any).location;
    (window as any).location = fakeLocation;
  } catch (e) {
    // If we can't delete, try Object.defineProperty
    try {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: fakeLocation
      });
    } catch (e2) {
      console.error('Cannot stub window.location:', e2);
    }
  }

  // Also stub document.location
  try {
    delete (document as any).location;
    (document as any).location = fakeLocation;
  } catch (e) {
    try {
      Object.defineProperty(document, 'location', {
        configurable: true,
        writable: true,
        value: fakeLocation
      });
    } catch (e2) {
      // ignore
    }
  }

  // Stub window.open
  (window as any).open = function() { return null; };

  // Use Jasmine's global beforeEach to reset before each test
  if (typeof beforeEach === 'function') {
    beforeEach(function() {
      // Ensure our stubs are still in place
      if ((window as any).location !== fakeLocation) {
        (window as any).location = fakeLocation;
      }
      if ((document as any).location !== fakeLocation) {
        (document as any).location = fakeLocation;
      }
    });
  }
})();

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true } },
);

// Provide common testing modules globally so standalone components and services
// that rely on HttpClient can be created without each spec importing the module.
// Provide lightweight defaults for commonly-missing providers in specs.
const toastrMock = (window as any).jasmine?.createSpyObj
  ? (window as any).jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning'])
  : { success: () => {}, error: () => {}, info: () => {}, warning: () => {} };
const toastConfigMock = {
  toastClass: 'toast',
  positionClass: 'toast-top-right',
  timeOut: 5000,
  extendedTimeOut: 1000,
  iconClasses: { error: 'toast-error', info: 'toast-info', success: 'toast-success', warning: 'toast-warning' }
};
const ngbActiveModalMock = { close: () => {}, dismiss: () => {} };
const activatedRouteMock = { snapshot: { queryParams: {} }, queryParams: { subscribe: () => ({}) } };

// Provide a minimal Cashfree stub so `InvoiceComponent` tests don't throw.
try {
  (window as any).Cashfree = (window as any).Cashfree || {};
} catch (e) {
  // ignore in non-browser test harnesses
}

// Ensure a safe default `environment` exists for components that parse it.
try {
  if (!localStorage.getItem('environment')) {
    localStorage.setItem('environment', JSON.stringify({ id: 'test-env' }));
  }
} catch (e) {
  // ignore when localStorage isn't available
}

// Normalize `localStorage.getItem` results so tests don't accidentally
// parse the literal strings 'undefined' or 'null' (which some tests
// or code paths may set). Treat those as missing values.
try {
  const _origGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key: string) {
    const v = _origGetItem.call(this, key);
    if (v === undefined || v === null || v === 'undefined' || v === 'null') return null;
    return v;
  };
} catch (e) {
  // ignore if Storage isn't available in this environment
}

// Patch JSON.parse to handle 'undefined' and 'null' strings safely
try {
  const _origJSONParse = JSON.parse;
  JSON.parse = function(text: string, reviver?: any) {
    if (text === 'undefined' || text === 'null' || text === undefined || text === null) {
      return null;
    }
    return _origJSONParse.call(JSON, text, reviver);
  };
} catch (e) {
  // ignore if JSON.parse cannot be patched
}

// Additional safe defaults to avoid JSON.parse('undefined') in tests
try {
  if (!localStorage.getItem('project')) {
    localStorage.setItem('project', JSON.stringify({ id: 'test-project' }));
  }
  if (!localStorage.getItem('accessToken')) {
    localStorage.setItem('accessToken', 'test-token');
  }
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', 'test-user');
  }
  if (!localStorage.getItem('userInfo')) {
    localStorage.setItem('userInfo', JSON.stringify({ id: 'test-user', name: 'Test User' }));
  }
  if (!localStorage.getItem('policies')) {
    localStorage.setItem('policies', JSON.stringify([]));
  }
  if (!localStorage.getItem('currency')) {
    localStorage.setItem('currency', JSON.stringify({ symbol: '$', code: 'USD' }));
  }
  if (!localStorage.getItem('availableTools')) {
    localStorage.setItem('availableTools', JSON.stringify([]));
  }
  if (!localStorage.getItem('theme-default')) {
    localStorage.setItem('theme-default', JSON.stringify('light'));
  }
  if (!localStorage.getItem('llmDeployments')) {
    localStorage.setItem('llmDeployments', JSON.stringify([]));
  }
} catch (e) {
  // ignore when localStorage isn't available
}

// Provide default resource usage to avoid parse errors in settings/metrics tests
try {
  if (!localStorage.getItem('resourceUsage')) {
    localStorage.setItem('resourceUsage', JSON.stringify([
      { resource_type: 'CPU', limit: 4, used: 1 },
      { resource_type: 'RAM', limit: 8192, used: 1024 },
      { resource_type: 'ephemeral_storage', limit: 100, used: 10 }
    ]));
  }
} catch (e) {
  // ignore when localStorage isn't available
}

getTestBed().configureTestingModule({
  imports: [HttpClientTestingModule],
  providers: [
    { provide: TOAST_CONFIG, useValue: toastConfigMock },
    { provide: ToastrService, useValue: toastrMock },
    { provide: NgbActiveModal, useValue: ngbActiveModalMock },
    { provide: ActivatedRoute, useValue: activatedRouteMock }
  ]
});

// Patch TestBed.configureTestingModule so individual specs automatically
// include common testing imports/providers when they call it without them.
const testBedRef: any = getTestBed();
const _originalConfigure = testBedRef.configureTestingModule.bind(testBedRef);
// Ensure overrides exist on the TestBed itself so standalone components or
// imported modules that register their own Toastr providers still get the
// safe config and spy instance during tests.
try {
  testBedRef.overrideProvider(TOAST_CONFIG, { useValue: toastConfigMock });
  testBedRef.overrideProvider(ToastrService, { useValue: toastrMock });
  testBedRef.overrideProvider(ActivatedRoute, { useValue: activatedRouteMock });
  testBedRef.overrideProvider(NgbActiveModal, { useValue: ngbActiveModalMock });
} catch (e) {
  // ignore if overrideProvider isn't available in this env
}
testBedRef.configureTestingModule = (cfg: any = {}) => {
  cfg.imports = Array.isArray(cfg.imports) ? cfg.imports : (cfg.imports ? [cfg.imports] : []);
  cfg.providers = Array.isArray(cfg.providers) ? cfg.providers : (cfg.providers ? [cfg.providers] : []);

  // Ensure HttpClientTestingModule and our common providers are present.
  if (!cfg.imports.some((m: any) => m === HttpClientTestingModule)) {
    cfg.imports.push(HttpClientTestingModule);
  }
  // Merge providers but avoid duplicates by token identity.
  const commonProviders = [
    { provide: ToastrService, useValue: toastrMock },
    { provide: TOAST_CONFIG, useValue: toastConfigMock },
    { provide: NgbActiveModal, useValue: ngbActiveModalMock },
    { provide: ActivatedRoute, useValue: activatedRouteMock }
  ];
  const existingTokens = new Set(cfg.providers.map((p: any) => p.provide || p));
  commonProviders.forEach((p) => {
    if (!existingTokens.has(p.provide)) {
      cfg.providers.push(p);
    }
  });

  return _originalConfigure(cfg);
};

 