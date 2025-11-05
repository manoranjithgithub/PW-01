import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LLMDeploymentsService } from '../llm-deployment.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

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
  envId = '';
  constructor(private fb: FormBuilder, private http: LLMDeploymentsService,
     private toastr: ToastrService, private router: Router) {

  }

  ngOnInit(): void {
    this.deploymentForm = this.fb.group({
      name: ['', [Validators.required]],
      modelId: ['', Validators.required],
      replicas: [1, [Validators.required]],
      instanceType: ['Nvidia L2', Validators.required],
      contextLength: [512, [Validators.required]],
      storageSize: [10, [Validators.required]],
      ephemeralStorageSize: [10, [Validators.required]],
      environmentId: [''],
    });
    this.envId = JSON.parse(`${localStorage.getItem('environment')}`).id || '';
  }
  get f() {
    return this.deploymentForm.controls;
  }
  isError(controlName: string, errorType: string): boolean {
    const control = this.deploymentForm.controls[controlName];
    return control.hasError(errorType) && control.touched;
  }
  onSubmit() {
    this.deploymentForm.get('environmentId')?.setValue(this.envId);
    this.submitted = true;
    if (this.deploymentForm.invalid) {
      return;
    }
    const raw = this.deploymentForm.getRawValue();
    const appendGi = (val: any) => {
      if (val === null || val === undefined) return val;
      const s = String(val);
      return s.endsWith('Gi') ? s : `${s}Gi`;
    };

    const payload = {
      ...raw,
      storageSize: appendGi(raw.storageSize),
      ephemeralStorageSize: appendGi(raw.ephemeralStorageSize),
    };

    this.http.createDeployement(payload).subscribe({
      next: (res: any) => {
        const msg = res?.message || 'Deployment created';
        this.toastr.success(msg);
        this.router.navigate(['llm/list']);
      },
      error: (err: any) => {
        const errMsg = err?.message || 'Failed to create deployment';
        this.toastr.error(errMsg);
      }
    });
  }
}
