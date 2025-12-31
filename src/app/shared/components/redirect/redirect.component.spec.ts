import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { toastConfigMock, createToastrSpy, activatedRouteMock } from '../../../../test-helpers/testing-mocks';

import { RedirectComponent } from './redirect.component';

describe('RedirectComponent', () => {
  let component: RedirectComponent;
  let fixture: ComponentFixture<RedirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedirectComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: TOAST_CONFIG, useValue: toastConfigMock },
        { provide: ToastrService, useValue: createToastrSpy() },
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
