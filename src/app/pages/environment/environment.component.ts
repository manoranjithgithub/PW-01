import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { EnvironmentService } from './environment.service';

@Component({
  selector: 'app-environment',
  standalone: true,
  imports: [RouterLink, RouterOutlet, ReactiveFormsModule, CommonModule],
  providers: [EnvironmentService],
  templateUrl: './environment.component.html',
  styleUrl: './environment.component.scss'
})

export class EnvironmentComponent implements OnInit {
  tableTheme = 'ag-theme-alpine';
  isOpen: boolean = false;
  nameValidation : string  = "Name must be alphanumeric & may contain hyphen. No special characters allowed.";
  regionOptions = [
    {
      name: 'ap-south-1 (Mumbai) - Default',
      value: 'ap-south-1'
    },
    {
      name: 'ap-southeast-1(Singapore)',
      value: 'ap-southeast-1'
    },  {
      name: 'us-central-1 (US)',
      value: 'us-central-1'
    }]

  environmentForm !: FormGroup;
  projectName: string = '';
  projectId: string = '';
  constructor(
    private fb: FormBuilder, private project: EnvironmentService, private shared: SharedService,
    private toaster: ToastrService, private router: Router
  ) {
   // this.tableTheme = this.shared.getCookie('theme');
    this.tableTheme = localStorage.getItem('theme') || 'ag-theme-alpine';
    this.isOpen = true;
    // const storedValue = this.shared.getCookie('project');
    const storedValue = localStorage.getItem('project');
    if (storedValue) {
      this.projectName = JSON.parse(storedValue).name;
      this.projectId = JSON.parse(storedValue).id;
    }
  }

  ngOnInit(): void {
    this.environmentForm = this.fb.group({
      name: ['', this.shared.isValidName()],
      region: [this.regionOptions[0].name]
    })
  }

  createEnvironment() {
    if (this.environmentForm.valid) {
      if(this.environmentForm.value.region == "ap-south-1 (Mumbai) - Default"){
        this.environmentForm.value.region = 'ap-south-1';
      }
      if(this.environmentForm.value.name == '')
        this.environmentForm.value.name = 'default';
      const req={
        name:this.environmentForm.value.name,
        region:this.environmentForm.value.region,
        projectId:this.projectId
      }
      this.project.createEnvironment(req).subscribe((res: any) => {
        if (res.status === 'success') {
          this.toaster.success(res.message);
          this.project.getEnvironmentsByProject(this.projectId).subscribe((envRes: any) => {
            this.shared.emitEnvDDChange(envRes.data);
          });
        //  this.shared.setCookie('environment', JSON.stringify(res?.data),10);
          localStorage.setItem('environment', JSON.stringify(res?.data));
          this.shared.emitEnvValueChange(res?.data);
          this.router.navigate(['/project']);
        }
        else {
          this.toaster.error("Environment creation failed");
          console.error(res.message);
        }
      });
    }
  }

  cancel(){
    this.isOpen = false;
    this.router.navigate(['/project']);
  }
}
