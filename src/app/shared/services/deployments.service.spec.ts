import { TestBed } from '@angular/core/testing';
import { DeploymentsService } from './deployments.service';
import { ToastrService,ToastrModule  } from 'ngx-toastr';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
          imports: [HttpClientTestingModule,ToastrModule.forRoot()], 
          providers: [DeploymentsService,ToastrService]
        });
        service = TestBed.inject(DeploymentsService);
        httpMock = TestBed.inject(HttpTestingController);
      });

      afterEach(() => {
        httpMock.verify();  
      });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
