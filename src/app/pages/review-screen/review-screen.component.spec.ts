import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewScreenComponent } from './review-screen.component';

describe('ReviewScreenComponent', () => {
  let component: ReviewScreenComponent;
  let fixture: ComponentFixture<ReviewScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewScreenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReviewScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
