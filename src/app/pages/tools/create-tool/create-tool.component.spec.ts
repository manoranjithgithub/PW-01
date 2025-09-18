import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateToolComponent } from './create-tool.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

describe('CreateToolComponent', () => {
  let component: CreateToolComponent;
  let fixture: ComponentFixture<CreateToolComponent>;
  let toastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    toastrService = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);



    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CreateToolComponent],
      providers: [
        { provide: ToastrService, useValue: toastrService },
        { provide: TOAST_CONFIG, useValue: {} },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ name: 'TestTool' }) 
          }
        }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
})