import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService,ToastrModule  } from 'ngx-toastr';
import { VolumesComponent } from './volumes.component';

describe('VolumesComponent', () => {
  let component: VolumesComponent;
  let fixture: ComponentFixture<VolumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolumesComponent,HttpClientModule,ToastrModule.forRoot()],
      providers: [ToastrService]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VolumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
