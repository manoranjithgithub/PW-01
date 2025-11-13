import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  CardGroupComponent, CardComponent, CardBodyComponent, AccordionButtonDirective,
  AccordionComponent,
  AccordionItemComponent,
  TemplateIdDirective,
  TooltipDirective, AlertComponent
} from '@coreui/angular';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectsService } from '../projects.service';
import { Router } from '@angular/router';
import { RegionOptions } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-create-environment',
  standalone: true,
  providers: [ProjectsService],
  imports: [ReactiveFormsModule, CommonModule, CardGroupComponent, CardComponent, CardBodyComponent,
    AccordionButtonDirective, AccordionComponent, AccordionItemComponent, TemplateIdDirective, TooltipDirective, AlertComponent],
  templateUrl: './create-environment.component.html',
  styleUrl: './create-environment.component.scss',
  encapsulation: ViewEncapsulation.None
})

export class CreateEnvironmentComponent implements OnInit {
  environmentForm!: FormGroup;
  tableTheme = 'ag-theme-alpine';
  isOpen: boolean = false;
  projectName: string = '';
  projectId: string = '';
  regionOptions = RegionOptions;
  environmentExhausted: boolean = false;
  resourceQuotaForm !: FormGroup;

  projectList: any = [];
  isBusiness: boolean = false;
  availableEnviroinments: any = [];

  constructor(
    private fb: FormBuilder, private project: ProjectsService, private shared: SharedService,
    private toaster: ToastrService, private router: Router
  ) {
    // this.tableTheme = this.shared.getCookie('theme');
    this.tableTheme = localStorage.getItem('theme-default') || 'ag-theme-alpine';
    this.isOpen = true;
    // const storedValue = this.shared.getCookie('project');
    const storedValue = localStorage.getItem('project');
    if (storedValue) {
      this.projectName = JSON.parse(storedValue).name;
      this.projectId = JSON.parse(storedValue).id;
    }
  }

  ngOnInit(): void {

    this.shared.user$.subscribe((user: any) => {
      this.isBusiness = user?.owner !== 'nimbuz';
    });

    this.environmentForm = this.fb.group({
      project: [this.projectName],
      name: ['default', [this.shared.isValidName(),
      Validators.maxLength(40), Validators.required, Validators.minLength(3),
      this.uniqueNameValidation()
      ]],
      region: [this.regionOptions[0].name]
    });

    this.project.getAllProjects().subscribe((res: any) => {
      if (res && res?.data) {
        this.projectList = res?.data;
        this.environmentForm.get('project')?.setValue(this.projectId)
      }
    })
    this.resourceQuotaForm = this.fb.group({
      cpuMaxPlatformLimit: ['10'],
      cpuMaxUserLimit: [''],
      ephemeralStorageMaxPlatformLimit: ['50'],
      ephemeralStorageMaxUserLimit: [''],
      memoryMaxPlatformLimit: ['20'],
      memoryMaxUserLimit: [''],
      pvcStorageMaxPlatformLimit: ['100'],
      pvcStorageMaxUserLimit: [''],
    });
    // this.getPlanLimits();

    this.environmentForm.get('project')?.valueChanges.subscribe((value: string) => {
      console.log(value)
      if (!value) return;
      this.project.getAllEnvironmentsByProject(value).subscribe({
        next: (response: any) => {
          if (response.data?.length > 0) {
            this.availableEnviroinments = response.data.map((item: any) => item.name.toLowerCase());
            const nameControl = this.environmentForm.get('name');
            nameControl?.updateValueAndValidity({ onlySelf: true });
            nameControl?.markAllAsTouched()
          }
        }, error: (error) => { }
      });
    })
  }
  createEnvironment() {
    if (this.environmentForm.valid) {
      if (this.environmentForm.value.region == "ap-south-1 (Mumbai) - Default") {
        this.environmentForm.value.region = 'ap-south-1';
      }
      if (this.environmentForm.value.name == '')
        this.environmentForm.value.name = 'default';
      const req = {
        name: this.environmentForm.value.name,
        region: this.environmentForm.value.region,
        projectId: this.environmentForm.value.project
      }
      this.project.createEnvironment(req).subscribe((res: any) => {
        if (res.status) {
          this.toaster.success(res.message);
          this.project.getEnvironmentsByProject(this.projectId).subscribe((envRes: any) => {
            this.project.getAllProjects().subscribe((res: any) => {
              const project = res.data.find((item: any) => item.id === this.environmentForm.get('project')?.value);
              this.shared.emitEnvDDChange(envRes.data);
              this.shared.emitProjectDDChange(project);
              // this.shared.setCookie('project', JSON.stringify(project), 10);
              localStorage.setItem('project', JSON.stringify(project));
              this.shared.emitProjectValueChange(project);
              // this.shared.setCookie('environment', JSON.stringify(res?.data), 10);
              localStorage.setItem('environment', JSON.stringify(res?.data));
              this.shared.emitEnvValueChange(res?.data);
              this.router.navigate(['/projects']);
            })

          });

        }
        else {
          this.toaster.error("Environment creation failed");
          console.error(res.message);
        }
      });
    }
  }
  cancel() {
    this.isOpen = false;
    this.router.navigate(['/projects']);
  }
  goBack() {
    this.router.navigate(['/projects']);
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
  uniqueNameValidation(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const envName = control.value?.trim().toLowerCase();
      const alreadyExists = this.availableEnviroinments
        .map((e: any) => e.toLowerCase())
        .includes(envName);

      return alreadyExists ? { uniqueName: true } : null;
    };
  }
}