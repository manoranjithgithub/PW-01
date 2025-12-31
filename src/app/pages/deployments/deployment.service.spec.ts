import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeploymentsService } from './deployment.service';
import { SharedService } from '../../shared/services/shared.service';
import { NgZone } from '@angular/core';
import * as sseUtils from '../../shared/utils/sse.utils';
import { of, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let httpMock: HttpTestingController;
  let loaderSpy: Partial<SharedService>;
  let zone: NgZone;

  beforeEach(() => {
    loaderSpy = { hide: jasmine.createSpy('hide') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DeploymentsService,
        { provide: SharedService, useValue: loaderSpy }
      ]
    });

    service = TestBed.inject(DeploymentsService);
    httpMock = TestBed.inject(HttpTestingController);
    zone = TestBed.inject(NgZone);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getDeployments should call correct endpoint', () => {
    const envId = 'env-1';
    const mock = { data: [{ id: 'd1' }] };
    service.getDeployments(envId).subscribe(res => expect((res as any).data).toEqual(mock.data));

    const expected = `${environment.deploymentManagement}/deployments?environmentId=${envId}`;
    const req = httpMock.expectOne(r => r.urlWithParams.indexOf(expected) === 0 || r.url.indexOf(expected) === 0 || r.urlWithParams.indexOf('/deployments') === 0);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getDeploymentById should include environment and project from localStorage', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-x' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-x' }));
    const id = 'dep-123';
    const mock = { data: { id } };

    service.getDeploymentById(id).subscribe(res => expect((res as any).data).toEqual(mock.data));

    const req = httpMock.expectOne(r => r.urlWithParams.indexOf(`deploymentId=${id}`) >= 0 && r.urlWithParams.indexOf('environmentId=env-x') >= 0 && r.urlWithParams.indexOf('projectId=proj-x') >= 0);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('createDeployement should POST with environment and project ids', () => {
    localStorage.setItem('environment', JSON.stringify({ id: 'env-y' }));
    localStorage.setItem('project', JSON.stringify({ id: 'proj-y' }));
    const body = { name: 'test' };
    const resp = { status: 'success' };

    service.createDeployement(body).subscribe(res => expect(res).toEqual(resp));

    const req = httpMock.expectOne(`${environment.deploymentManagement}/deployments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.environmentId).toBe('env-y');
    expect(req.request.body.projectId).toBe('proj-y');
    req.flush(resp);
  });

  it('uploadFileToS3 should map 200/204 to true and call loader.hide', () => {
    const url = 'https://s3.mock';
    const file = new Blob(['x']);
    const contentType = 'text/plain';
    let result: any;

    service.uploadFileToS3(url, file, contentType).subscribe(res => result = res);

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('PUT');
    // simulate 200
    req.flush(null, { status: 200, statusText: 'OK' });
    expect(result).toBeTrue();
    expect((loaderSpy.hide as jasmine.Spy)).toHaveBeenCalled();

    // ensure 204 handled as true as well
    service.uploadFileToS3(url, file, contentType).subscribe(res => result = res);
    const req2 = httpMock.expectOne(url);
    req2.flush(null, { status: 204, statusText: 'No Content' });
    expect(result).toBeTrue();
  });

  it('getAvailableBranches should add provider-specific params', () => {
    // note: signature is getAvailableBranches(projectID, provider, repoId)
    service.getAvailableBranches('proj-1', 'gitlab', 123).subscribe();
    const req = httpMock.expectOne(r => r.url.indexOf('/integrations/vcs/resources') >= 0 && r.url.indexOf('type=branches') >= 0 && r.url.indexOf('&repoId=123') >= 0);
    expect(req.request.method).toBe('GET');
    req.flush({});

    service.getAvailableBranches('proj-2', 'github', 'my-repo').subscribe();
    const req2 = httpMock.expectOne(r => r.url.indexOf('&repoName=my-repo') >= 0);
    expect(req2.request.method).toBe('GET');
    req2.flush({});
  });

  it('liveReleaseStatus should return an observable (SSE)', () => {
    localStorage.setItem('accessToken', 'tok-1');
    localStorage.setItem('project', JSON.stringify({ id: 'proj-a' }));
    localStorage.setItem('environment', JSON.stringify({ id: 'env-a' }));

    const depId = 'dep-777';
    const obs: any = service.liveReleaseStatus(depId);
    expect(obs).toBeTruthy();
    expect(typeof obs.subscribe).toBe('function');
  });

  it('handleError should pick nested details or message when invoked directly', () => {
    // directly call the private handler to validate mapping of shapes
    const nestedErr = new HttpErrorResponse({ error: { error: { details: 'nested details' } } });
    (service as any).handleError(nestedErr).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBe('nested details')
    });

    const msgErr = new HttpErrorResponse({ error: { message: 'simple message' } });
    (service as any).handleError(msgErr).subscribe({
      next: () => fail('expected error'),
      error: (e: Error) => expect(e.message).toBe('simple message')
    });
  });

});
