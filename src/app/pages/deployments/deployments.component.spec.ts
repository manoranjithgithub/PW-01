import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeploymentsComponent } from './deployments.component';
import { ToastrService,ToastrModule  } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('DeploymentsComponent', () => {
  let component: DeploymentsComponent;
  let fixture: ComponentFixture<DeploymentsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentsComponent,HttpClientTestingModule, ToastrModule.forRoot(),BrowserModule, BrowserAnimationsModule],
      providers: [ToastrService,
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: 123 }) }  
        }
      ]

    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeploymentsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController); 
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
