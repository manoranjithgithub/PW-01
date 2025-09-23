import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProjectsService } from '../projects.service';
import { SharedService } from '../../../shared/services/shared.service';
import {
  CardGroupComponent, CardComponent, CardBodyComponent, AccordionButtonDirective,
  AccordionComponent,
  AccordionItemComponent,
  TemplateIdDirective,
  TooltipDirective,
  AlertComponent
} from '@coreui/angular';
import { REGION_OPTIONS } from '../../../shared/constants/nimbuz.constant';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, CardGroupComponent, CardComponent, CardBodyComponent,
    AccordionButtonDirective, AccordionComponent, AccordionItemComponent, TemplateIdDirective, TooltipDirective,
    AlertComponent
  ],
  providers: [ProjectsService],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CreateProjectComponent implements OnInit {
  projectForm !: FormGroup;
  resourceQuotaForm !: FormGroup;
  isConfigure: boolean = false;
  nameValidation: string = "Name must be alphanumeric & may contain hyphen. No special characters allowed.";
  tableTheme = 'ag-theme-alpine';
  showButtonInChild = false;
  regionOptions: any = REGION_OPTIONS;
  projectExhausted: boolean = false;
  environmentExhausted: boolean = false;
  orgName:string = '';

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private toastr: ToastrService,
    private shared: SharedService,
    private project: ProjectsService) {
    // this.tableTheme = this.shared.getCookie('theme');
      this.tableTheme = localStorage.getItem('theme') || 'ag-theme-alpine';
  }

  ngOnInit(): void {
    this.shared.user$.subscribe((user: any) => {
      this.orgName = user.owner;
    });

   // const envCookie = this.shared.getCookie('environment');
   const envCookie = localStorage.getItem('environment');
    if (envCookie) {
      const envId = JSON.parse(envCookie).id
      this.getResourceUsage(envId);
    }
    this.projectForm = this.fb.group({
      projectName: ['', [this.shared.isValidName(), Validators.maxLength(40)]],
      projectDesc: ['', [Validators.required, Validators.maxLength(250)]],
      environmentName: ['default', [this.shared.isValidName(), Validators.maxLength(40)]],
      region: [this.regionOptions[0].name],
    })

    this.resourceQuotaForm = this.fb.group({
      cpu: this.fb.group({
        current_cpu: [{ value: '', disabled: true }],
        min_cpu: [''],
        max_cpu: [''],
        unit: ['']
      }),
      ram: this.fb.group({
        current_ram: [{ value: '', disabled: true }],
        min_ram: [''],
        max_ram: [''],
        unit: ['']
      }),
      storage: this.fb.group({
        current_storage: [{ value: '', disabled: true }],
        min_storage: [''],
        max_storage: [''],
        unit: ['']
      })
    });

    this.getPlanLimits();

  }

  createProject() {
    if (this.projectForm.value.region == "ap-south-1 (Mumbai) - Default") {
      this.projectForm.value.region = 'ap-south-1';
    }
    if (this.projectForm.value.projectName == "") {
      this.projectForm.value.projectName = 'default';
    }
    if (this.projectForm.value.environmentName == "") {
      this.projectForm.value.environmentName = 'default';
    }
    const req = {
      name: this.projectForm.value.projectName,
      description: this.projectForm.value.projectDesc,
      envName: this.projectForm.value.environmentName,
      region: this.projectForm.value.region
    }
    this.project.createProject(req).subscribe((res: any) => {
      if (res.status?.toLowerCase() == 'success') {
        this.toastr.success(res.message);
        this.project.getAllProjects().subscribe((projectRes: any) => {
          this.shared.emitProjectDDChange(projectRes.data);
         // this.shared.setCookie('project', JSON.stringify(projectRes.data[0]), 10);
          localStorage.setItem('project', JSON.stringify(projectRes.data[0]));
          this.shared.emitProjectValueChange(projectRes.data[0]);
         // this.shared.setCookie('environment', JSON.stringify(projectRes.data[0]?.environments[0]), 10);
          localStorage.setItem('environment', JSON.stringify(projectRes.data[0]?.environments[0]));
          this.shared.emitProjectValueChange(projectRes.data[0]?.environments[0]);
          this.route.navigate(['/projects']);
        });
      }

    },
      error => {
        this.toastr.error(error);

      });

  }

  goBack() {
    this.route.navigate(['/projects']);
  }

  getPlanLimits() {
    const plan = 'lite';
    this.project.getPlanLimits(plan).subscribe(
      (res: any) => {
        const data = res.data;

        const cpu = data.find((d: any) => d.resource_type === 'CPU');
        const ram = data.find((d: any) => d.resource_type === 'RAM');
        const ephemeralStorage = data.find((d: any) => d.resource_type === 'ephemeral_storage');

        if (cpu) {
          this.resourceQuotaForm.get('cpu.current_cpu')?.setValue(cpu.default_limit);
          this.resourceQuotaForm.get('cpu.min_cpu')?.setValue(0);
          this.resourceQuotaForm.get('cpu.max_cpu')?.setValue(cpu.max_limit);
          this.resourceQuotaForm.get('cpu.unit')?.setValue(cpu.unit);
        }

        if (ram) {
          this.resourceQuotaForm.get('ram.current_ram')?.setValue(ram.default_limit);
          this.resourceQuotaForm.get('ram.min_ram')?.setValue(0);
          this.resourceQuotaForm.get('ram.max_ram')?.setValue(ram.max_limit);
          this.resourceQuotaForm.get('ram.unit')?.setValue(ram.unit);
        }

        if (ephemeralStorage) {
          this.resourceQuotaForm.get('storage.current_storage')?.patchValue(ephemeralStorage.default_limit);
          this.resourceQuotaForm.get('storage.min_storage')?.patchValue(0);
          this.resourceQuotaForm.get('storage.max_storage')?.patchValue(ephemeralStorage.max_limit);
          this.resourceQuotaForm.get('storage.unit')?.setValue(ephemeralStorage.unit);
        }
      },
      error => {
        console.error('Error:', error);
      });
  }
  getResourceUsage(envId: string): void {
    if (!envId || this.orgName !== 'nimbuz') return;
    this.project.getResourceUsage(envId).subscribe((res: any) => {
      if (res.status && res.data) {
       // this.shared.setCookie('resourceUsage', JSON.stringify(res.data), 10);
        localStorage.setItem('resourceUsage', JSON.stringify(res.data));

        const projectResource = res.data.find((r: any) => r.resource_type === 'projects');
        this.projectExhausted = projectResource?.remaining === 0;

        const environmentResource = res.data.find((r: any) => r.resource_type === 'environments');
        this.environmentExhausted = environmentResource?.remaining === 0;
      }
    });
  }
}
