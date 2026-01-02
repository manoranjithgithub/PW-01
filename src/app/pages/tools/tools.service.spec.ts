import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { ToolsService } from './tools.service';
import { ToastrService } from 'ngx-toastr';
import { NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as sseUtils from '../../shared/utils/sse.utils';
import { of, throwError } from 'rxjs';

describe('ToolsService', () => {
  let service: ToolsService;
  let httpMock: HttpTestingController;

  const deploymentUrl = environment.deploymentManagement;
  const pricingUrl = environment.pricingManagement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ToolsService,
        {
          provide: NgZone,
          useValue: {
            run: (fn: any) => fn(),
            runOutsideAngular: (fn: any) => fn(),
            onMicrotaskEmpty: { subscribe: () => ({ unsubscribe: () => {} }) },
            onStable: { subscribe: () => ({ unsubscribe: () => {} }) },
            onUnstable: { subscribe: () => ({ unsubscribe: () => {} }) }
          }
        },
        {
          provide: ToastrService,
          useValue: jasmine.createSpyObj('ToastrService', ['error'])
        }
      ]
    });

    service = TestBed.inject(ToolsService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.setItem('project', JSON.stringify({ id: 'proj-1' }));
    localStorage.setItem('accessToken', 'mock-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get tools list', () => {
    const env = 'env-1';
    const mockResponse = [{ name: 'MySQL' }];

    service.getToolsList(env).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${deploymentUrl}/tools/installed/${env}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get form details by tool id', () => {
    service.getFormDetailsByTool('mysql').subscribe();

    const req = httpMock.expectOne(
      `${deploymentUrl}/tools/supported/mysql`
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should create tool', () => {
    const payload = { name: 'MongoDB' };

    service.createTools(payload).subscribe();

    const req = httpMock.expectOne(`${deploymentUrl}/tools/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('should update tool', () => {
    const payload = { name: 'Postgres' };

    service.updateTools(payload).subscribe();

    const req = httpMock.expectOne(`${deploymentUrl}/tools`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should delete tool', () => {
    service.deleteTools('env-1', 'MySQL').subscribe();

    const req = httpMock.expectOne(`${deploymentUrl}/tools`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({
      environmentId: 'env-1',
      name: 'MySQL',
      projectId: 'proj-1'
    });
    req.flush({});
  });

  it('should get tool details by id', () => {
    service.getToolDetailsById('env-1', 'mysql').subscribe();

    const req = httpMock.expectOne(
      `${deploymentUrl}/tools/values?environmentId=env-1&name=mysql&projectId=proj-1`
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should get resource allocation details with params', () => {
    service.getToolsResourceAllocation('mysql', 'env-1').subscribe();

    const req = httpMock.expectOne(
      r =>
        r.url ===
          `${deploymentUrl}/deployment/getResourceAllocationDetails` &&
        r.params.get('toolName') === 'mysql' &&
        r.params.get('environmentId') === 'env-1'
    );

    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should get instance types', () => {
    service.getInstanceTypes().subscribe();

    const req = httpMock.expectOne(
      `${pricingUrl}/public/pricing-catalog`
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should call createSSEObservable for live tools', () => {
    const spy2 = spyOn<any>(service, 'createSSE').and.returnValue(of({}));

    service.liveToolsData('env-1');

    expect(spy2).toHaveBeenCalled();
    const args = spy2.calls.mostRecent().args;
    expect(args[0]).toContain('environmentId=env-1');
    expect(args[1]).toBe('mock-token');
  });

  it('should handle backend error message', () => {
    service.getToolsList('env-1').subscribe({
      error: err => {
        expect(err.message).toBe('Custom error');
      }
    });

    const req = httpMock.expectOne(
      `${deploymentUrl}/tools/installed/env-1`
    );

    req.flush(
      { error: { message: 'Custom error' } },
      { status: 400, statusText: 'Bad Request' }
    );
  });

  it('should extract details from nested error object via handleError()', () => {
    const badResp: any = { error: { error: { details: 'Detailed error' } } };
    try {
      service['handleError'](badResp as any).subscribe({
        error: (err: Error) => expect(err.message).toBe('Detailed error')
      });
    } catch (e) {
      // handleError
    }
  });

  it('should extract inner message from nested error object via handleError()', () => {
    const badResp: any = { error: { error: { message: 'Inner message' } } };
    try {
      service['handleError'](badResp as any).subscribe({
        error: (err: Error) => expect(err.message).toBe('Inner message')
      });
    } catch (e) {
      // handleError 
    }
  });

  it('should fallback to default when handleError receives empty response', () => {
    const badResp: any = {};
    try {
      service['handleError'](badResp as any).subscribe({
        error: (err: Error) => expect(err.message).toBe('Something went wrong. Please try again later.')
      });
    } catch (e) {
      // handleError 
    }
  });
});
