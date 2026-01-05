import { InjectionToken } from '@angular/core';
import { TOAST_CONFIG } from 'ngx-toastr';
import { of } from 'rxjs';

export const toastConfigMock = {
  toastClass: 'toast',
  positionClass: 'toast-top-right',
  timeOut: 5000,
  extendedTimeOut: 1000,
  closeButton: true,
  tapToDismiss: true,
  enableHtml: false,
  progressBar: false,
  newestOnTop: true,
  preventDuplicates: false,
  countDuplicates: false,
  resetTimeoutOnDuplicate: false,
  iconClasses: {
    error: 'toast-error',
    info: 'toast-info',
    success: 'toast-success',
    warning: 'toast-warning',
  },
};

export const createToastrSpy = () => ({
  success: jasmine.createSpy('success'),
  error: jasmine.createSpy('error'),
  info: jasmine.createSpy('info'),
  warning: jasmine.createSpy('warning'),
});

export const activatedRouteMock = {
  snapshot: { url: [], params: {}, children: [] },
  queryParams: of({}),
  fragment: of(null),
  params: {},
  children: [],
};
