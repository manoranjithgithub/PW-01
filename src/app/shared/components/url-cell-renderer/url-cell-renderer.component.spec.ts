import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UrlCellRendererComponent } from './url-cell-renderer.component';

describe('UrlCellRendererComponent', () => {
  let component: UrlCellRendererComponent;
  let fixture: ComponentFixture<UrlCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UrlCellRendererComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UrlCellRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
