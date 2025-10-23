import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LLMDeploymentsService } from '../llm-deployment.service';

@Component({
  selector: 'app-create-deployment',
  templateUrl: './create-deployment.component.html',
  styleUrls: ['./create-deployment.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  providers:[LLMDeploymentsService]
})
export class CreateDeploymentComponent implements OnInit {
  deploymentForm!: FormGroup;
  submitted = false;
  constructor(private fb: FormBuilder, private http:LLMDeploymentsService) {

  }

  ngOnInit(): void {
    this.deploymentForm = this.fb.group({
      llmId: ['', Validators.required],
      replica: [1, [Validators.required]],
      instanceType: [{ value: 'femto.m', disabled: true }],
      contextLength: [512, [Validators.required]],
      storage: [10, [Validators.required]],
    });
  }
  get f() {
    return this.deploymentForm.controls;
  }
  isError(controlName: string, errorType: string): boolean {
    const control = this.deploymentForm.controls[controlName];
    return control.hasError(errorType) && control.touched;
  }
  onSubmit() {
    this.submitted = true;
    if (this.deploymentForm.invalid) {
      return;
    }
    this.http.createDeployement(this.deploymentForm.getRawValue()).subscribe(res => {
    console.log('Deployment Data:', res);
    })
  }
}
