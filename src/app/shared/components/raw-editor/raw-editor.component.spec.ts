import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawEditorComponent } from './raw-editor.component';

describe('RawEditorComponent', () => {
  let component: RawEditorComponent;
  let fixture: ComponentFixture<RawEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RawEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RawEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
