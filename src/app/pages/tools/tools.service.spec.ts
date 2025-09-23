import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ToolsService } from './tools.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

describe('ToolsService', () => {
    let service: ToolsService;
    let httpMock: HttpTestingController;
    let toastrService: jasmine.SpyObj<ToastrService>;

    beforeEach(() => {
        toastrService = jasmine.createSpyObj('ToastrService', ['error']);
        
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ToolsService,
                { provide: ToastrService, useValue: toastrService }
            ]
        });

        service = TestBed.inject(ToolsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch tools list', () => {
        const mockResponse = [{ id: 1, name: 'Tool 1' }];
        const env = 'dev';

        service.getToolsList(env).subscribe(data => {
            expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/${env}/tools`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should fetch form details by tool ID', () => {
        const mockResponse = { id: 1, name: 'Tool 1' };
        const toolId = 1;

        service.getFormDetailsByTool(toolId).subscribe(data => {
            expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.legacyUrl}/tools/${toolId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should handle errors correctly', () => {
      const errorResponse = new HttpErrorResponse({
          error: { error: 'Failed to load' }, 
          status: 500,
          statusText: 'Internal Server Error'
      });
  
      const env = 'dev';
  
      service.getToolsList(env).subscribe(
          () => fail('Expected an error'),
          (error) => {
              expect(error).toBeInstanceOf(Error);
              expect(error.message).toBe('Something bad happened; please try again later.');
              expect(toastrService.error).toHaveBeenCalledWith('Failed to load', 'Error'); 
          }
      );
  
      const req = httpMock.expectOne(`${environment.apiUrl}/${env}/tools`);
      req.flush(errorResponse.error, { status: errorResponse.status, statusText: errorResponse.statusText });
  });
  

    it('should create a tool', () => {
        const mockRequest = { name: 'New Tool' };
        const mockResponse = { id: 1, ...mockRequest };
        const env = 'dev';

        service.createTools(env, mockRequest).subscribe(data => {
            expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/${env}/tools`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });

    it('should update a tool', () => {
        const mockRequest = { name: 'Updated Tool' };
        const mockResponse = { success: true };
        const env = 'dev';
        const toolName = 'Tool1';

        service.updateTools(env, toolName, mockRequest).subscribe(data => {
            expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/${env}/tools/${toolName}`);
        expect(req.request.method).toBe('PUT');
        req.flush(mockResponse);
    });

    it('should delete a tool', () => {
        const mockResponse = { success: true };
        const env = 'dev';
        const toolName = 'Tool1';

        service.deleteTools(env, toolName).subscribe(data => {
            expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/${env}/tools/${toolName}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(mockResponse);
    });

});
