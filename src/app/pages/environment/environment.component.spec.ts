import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnvironmentComponent } from './environment.component';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService,ToastrModule  } from 'ngx-toastr';

describe('EnvironmentComponent', () => {
  let component: EnvironmentComponent;
  let fixture: ComponentFixture<EnvironmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvironmentComponent,HttpClientModule,ToastrModule.forRoot()],
      providers: [ToastrService]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EnvironmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
