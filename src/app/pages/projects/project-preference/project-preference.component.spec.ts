import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPreferenceComponent } from './project-preference.component';
import { FormArray } from '@angular/forms';

describe('ProjectPreferenceComponent', () => {
  let component: ProjectPreferenceComponent;
  let fixture: ComponentFixture<ProjectPreferenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPreferenceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectPreferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return rulesFormArray as FormArray', () => {
    const formArray = component.rulesFormArray;
    expect(formArray).toBeInstanceOf(FormArray);
  });

  it('should create a rule form group with emailID control', () => {
    const ruleGroup = component.createRule();
    expect(ruleGroup.contains('emailID')).toBeTrue();
  });

  it('should add a new rule to rulesFormArray', () => {
    const initialLength = component.rulesFormArray.length;
    component.addEmail();
    const newLength = component.rulesFormArray.length;
    expect(newLength).toBe(initialLength + 1);
  });

  it('should remove a rule from rulesFormArray', () => {
    component.addEmail();
    component.addEmail();
    const lengthBeforeRemove = component.rulesFormArray.length;

    component.removeEmail(0);
    const lengthAfterRemove = component.rulesFormArray.length;

    expect(lengthAfterRemove).toBe(lengthBeforeRemove - 1);
  });
});
