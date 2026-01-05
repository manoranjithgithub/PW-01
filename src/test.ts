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
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        setTransform: () => {},
        transform: () => {},
        resetTransform: () => {},
        save: () => {},
        restore: () => {},
        drawImage: () => {},
        createImageData: () => ({ width: 0, height: 0, data: [] }),
        getImageData: (_: any, __: any, ___: any, ____: any) => ({ data: [] }),
        putImageData: () => {},
        isPointInPath: () => false,
        setLineDash: () => {},
        getLineDash: () => [],
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createPattern: () => ({}),
        canvas: { width: 300, height: 150 },
      };
      return ctx;
    };

    (HTMLCanvasElement.prototype as any).getContext = (HTMLCanvasElement.prototype as any).getContext || function(type?: string) {
      if (!type || type === '2d') return safeContext();
      return null;
    };
  }
} catch (e) {
  // Ignore if HTMLCanvasElement is not defined
}

(function() {
  const _origLocation = window.location;
  
  const fakeLocation = {
    reload: function() {  },
    assign: function(url: string) {  },
    replace: function(url: string) {  },
    toString: function() { return _origLocation.href; },
    _href: _origLocation.href,
    get href() { return this._href; },
    set href(v: string) { this._href = v; },
    origin: _origLocation.origin,
    protocol: _origLocation.protocol,
    host: _origLocation.host,
    hostname: _origLocation.hostname,
    port: _origLocation.port,
    pathname: _origLocation.pathname,
    search: _origLocation.search,
    hash: _origLocation.hash
  };

 try {
    delete (window as any).location;
    (window as any).location = fakeLocation;
  } catch (e) {
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

  (window as any).open = function() { return null; };

  if (typeof beforeEach === 'function') {
    beforeEach(function() {
      if ((window as any).location !== fakeLocation) {
        (window as any).location = fakeLocation;
      }
      if ((document as any).location !== fakeLocation) {
        (document as any).location = fakeLocation;
      }
    });
  }
})();

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true } },
);

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

try {
  (window as any).Cashfree = (window as any).Cashfree || {};
} catch (e) {
  // ignore 
}

try {
  if (!localStorage.getItem('environment')) {
    localStorage.setItem('environment', JSON.stringify({ id: 'test-env' }));
  }
} catch (e) {
  // ignore 
}

try {
  const _origGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key: string) {
    const v = _origGetItem.call(this, key);
    if (v === undefined || v === null || v === 'undefined' || v === 'null') return null;
    return v;
  };
} catch (e) { 
  //ignore
  }

try {
  const _origJSONParse = JSON.parse;
  JSON.parse = function(text: string, reviver?: any) {
    if (text === 'undefined' || text === 'null' || text === undefined || text === null) {
      return null;
    }
    return _origJSONParse.call(JSON, text, reviver);
  };
} catch (e) {
  // ignore 
}

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
  // ignore 
}

try {
  if (!localStorage.getItem('resourceUsage')) {
    localStorage.setItem('resourceUsage', JSON.stringify([
      { resource_type: 'CPU', limit: 4, used: 1 },
      { resource_type: 'RAM', limit: 8192, used: 1024 },
      { resource_type: 'ephemeral_storage', limit: 100, used: 10 }
    ]));
  }
} catch (e) {
  // ignore 
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

const testBedRef: any = getTestBed();
const _originalConfigure = testBedRef.configureTestingModule.bind(testBedRef);
try {
  testBedRef.overrideProvider(TOAST_CONFIG, { useValue: toastConfigMock });
  testBedRef.overrideProvider(ToastrService, { useValue: toastrMock });
  testBedRef.overrideProvider(ActivatedRoute, { useValue: activatedRouteMock });
  testBedRef.overrideProvider(NgbActiveModal, { useValue: ngbActiveModalMock });
} catch (e) {
  // ignore 
}
testBedRef.configureTestingModule = (cfg: any = {}) => {
  cfg.imports = Array.isArray(cfg.imports) ? cfg.imports : (cfg.imports ? [cfg.imports] : []);
  cfg.providers = Array.isArray(cfg.providers) ? cfg.providers : (cfg.providers ? [cfg.providers] : []);

  if (!cfg.imports.some((m: any) => m === HttpClientTestingModule)) {
    cfg.imports.push(HttpClientTestingModule);
  }
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

 