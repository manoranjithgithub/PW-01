import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsersListService } from './users-list.service';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

describe('UsersListService', () => {
  let service: UsersListService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const toastrSpy = jasmine.createSpyObj('ToastrService', ['error', 'success']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UsersListService,
        { provide: ToastrService, useValue: toastrSpy },
        { provide: TOAST_CONFIG, useValue: {} }
      ]
    });

    service = TestBed.inject(UsersListService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call getAllUSers with correct URL', () => {
    service.getAllUSers().subscribe();
    const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/user/list-user`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [] });
  });

  it('should POST inviteNewUser', () => {
    const body = { username: 'u' };
    service.inviteNewUser(body).subscribe();
    const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/user/invite-user`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ status: 'success' });
  });

  it('should GET policies and projects endpoints', () => {
    service.getPolicies().subscribe();
    let req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies/org`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [] });

    service.getAllProjects().subscribe();
    req = httpMock.expectOne(`${environment.projectsBaseUrl}/projects`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [] });
  });

  it('should create, update and delete policy with correct methods', () => {
    const payload = { p: 1 };
    service.createPolicy(payload).subscribe();
    let req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'success' });

    service.updatePolicy(payload).subscribe();
    req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies`);
    expect(req.request.method).toBe('PUT');
    req.flush({ status: 'success' });

    service.deletePolicy(payload).subscribe();
    req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/policies`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual(payload);
    req.flush({ status: 'success' });
  });

  it('should call getEnvironmentsByProject with query param', () => {
    service.getEnvironmentsByProject('proj1').subscribe();
    const req = httpMock.expectOne(`${environment.projectsBaseUrl}/environments?projectId=proj1`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [] });
  });

  it('should propagate error message via handleError', (done) => {
    service.getAllUSers().subscribe({
      next: () => fail('expected error'),
      error: (err: any) => {
        expect(err).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne(`${environment.usermanagementBaseUrl}/user/list-user`);
    req.flush({ error: { message: 'x' } }, { status: 500, statusText: 'Server Error' });
  });
  it('should handle client-side ErrorEvent and call toastr.error', (done) => {
    const toastr = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    service.getAllUSers().subscribe({
      next: () => fail('expected error'),
      error: (err) => {
        expect(toastr.error).toHaveBeenCalled();
        expect(err).toBe('Something bad happened; please try again later.');
        done();
      }
    });
    const req = httpMock.expectOne(
      `${environment.usermanagementBaseUrl}/user/list-user`
    );
    const errorEvent = new ErrorEvent('NetworkError', {
      message: 'Client error'
    });
    req.error(errorEvent);
  });
  it('should log server error message when error.error.error exists', (done) => {
    spyOn(console, 'error');
    service.getAllUSers().subscribe({
      next: () => fail('expected error'),
      error: (err) => {
        expect(console.error).toHaveBeenCalledWith('Server error occurred');
        expect(err).toBe('Something bad happened; please try again later.');
        done();
      }
    });
    const req = httpMock.expectOne(
      `${environment.usermanagementBaseUrl}/user/list-user`
    );
    req.flush(
      { error: 'Server error occurred' },
      { status: 500, statusText: 'Server Error' }
    );
  });
  it('should fallback to default error message when server error is empty', (done) => {
    spyOn(console, 'error');

    service.getAllUSers().subscribe({
      next: () => fail('expected error'),
      error: (err) => {
        expect(console.error).toHaveBeenCalledWith('Please try again later');
        expect(err).toBe('Something bad happened; please try again later.');
        done();
      }
    });

    const req = httpMock.expectOne(
      `${environment.usermanagementBaseUrl}/user/list-user`
    );

    req.flush({}, { status: 500, statusText: 'Server Error' });
  });
});
