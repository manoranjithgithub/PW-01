import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountComponent } from './account-settings.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ToastrService,ToastrModule  } from 'ngx-toastr';
import { DeploymentsService } from '../../shared/services/deployments.service';
import { AccountSettingsService } from './account-settings.service';
describe('AccountComponent', () => {
  let component: AccountComponent;
  let fixture: ComponentFixture<AccountComponent>;
  let service: AccountSettingsService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountComponent, HttpClientTestingModule,ToastrModule.forRoot()],
      providers: [AccountSettingsService]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

     service = TestBed.inject(AccountSettingsService);
     httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.accountForm.value).toEqual({
      name: '',
      email: '',
      avatar: ''
    });
  });

  it('should mark form as invalid if required fields are empty', () => {
    component.onSubmit();
    expect(component.accountForm.invalid).toBeTrue();
  });

  it('should check if a form control is invalid', () => {
    const controlName = 'email';
    component.accountForm.controls[controlName].markAsTouched();
    expect(component.isInvalid(controlName)).toBeTrue();
  });

  it('should update a account information and return the updated account information', () => {
    const req = {
      name: 'Test-1',
      email: 'manoranjith@dilligentech.com',
      avatar: 'https://app.dev.nimbuz.tech/assets/images/pass-logo.png'
    };

    const mockResponse = {
      status: 'success',
      message: 'updated successfully',
      data: {
        name: "Test-1",
        userName: "Test",
        email: "manoranjith@dilligentech.com",
        avatar: "https://app.dev.nimbuz.tech/assets/images/pass-logo.png"
      }
    };

    service.updateAccountInfo(req).subscribe((response : any) => {
      expect(response.data.name).toBe(req.name); 
      expect(response.data.email).toBe(req.email); 

      expect(response.data.avatar).toBe(req.avatar); 
    });
  });

});
