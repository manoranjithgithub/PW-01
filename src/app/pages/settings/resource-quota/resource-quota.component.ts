import { Component,Input, OnInit  } from '@angular/core';
import { CardBodyComponent,CardComponent,CardGroupComponent,NavComponent, NavItemComponent, NavLinkDirective, TabContentRefDirective, TabContentComponent, TabPaneComponent,
  FormControlDirective,  FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
 } from '@coreui/angular';
import {  FormsModule, ReactiveFormsModule, FormBuilder,FormGroup } from '@angular/forms';
import { SharedService } from '../../../shared/services/shared.service';
import { ProjectsService } from '../../projects/projects.service';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-resource-quota',
    standalone:true,
    imports: [CardGroupComponent, CardComponent, CardBodyComponent, NavComponent, NavItemComponent, NavLinkDirective,
        TabContentRefDirective, TabContentComponent, TabPaneComponent, FormControlDirective, FormsModule,
        FormCheckInputDirective, FormCheckLabelDirective, FormDirective, FormCheckComponent, ReactiveFormsModule,CommonModule
    ],
    providers: [SettingsService, ProjectsService],
    templateUrl: './resource-quota.component.html',
    styleUrl: './resource-quota.component.scss'
})


export class ResourceQuotaComponent implements OnInit{
  resourceQuotaForm!:FormGroup;
  @Input() showButton: boolean = false;
  
  constructor(private http:SettingsService, private shared:SharedService, private fb:FormBuilder, private project:ProjectsService){
   
  }

  ngOnInit(){
    this.initializeForm();
    this.getPlanLimits();
  }

  initializeForm(): void {
    this.resourceQuotaForm = this.fb.group({
      cpu:this.fb.group({
      current_cpu:[{value:'',disabled:true}],
      min_cpu:[''],
      max_cpu:[''],
      unit:['']
      }),
      ram:this.fb.group({
      current_ram:[{value:'',disabled:true}],
      min_ram:[''],
      max_ram:[''],
      unit:['']
      }),
      storage:this.fb.group({
      current_storage:[{value:'',disabled:true}],
      min_storage:[''],
      max_storage:[''],
      unit:['']
      })
    });
  }

  
  getPlanLimits(){
    const plan = 'Trial';
    this.project.getPlanLimits(plan).subscribe(
      (res: any) => {
        this.resourceQuotaForm.get('cpu.current_cpu')?.setValue(res.data.details[0]?.default_limit);
        this.resourceQuotaForm.get('cpu.min_cpu')?.setValue(0);
        this.resourceQuotaForm.get('cpu.max_cpu')?.setValue(res.data.details[0]?.max_limit);
        this.resourceQuotaForm.get('cpu.unit')?.setValue(res.data.details[0]?.unit);
        
        this.resourceQuotaForm.get('ram.current_ram')?.setValue(res.data.details[1]?.default_limit);
        this.resourceQuotaForm.get('ram.min_ram')?.setValue(0);
        this.resourceQuotaForm.get('ram.max_ram')?.setValue(res.data.details[1]?.max_limit);
        this.resourceQuotaForm.get('ram.unit')?.setValue(res.data.details[1]?.unit);

        this.resourceQuotaForm.get('storage.current_storage')?.patchValue(res.data.details[2]?.default_limit);
        this.resourceQuotaForm.get('storage.min_storage')?.patchValue(0);
        this.resourceQuotaForm.get('storage.max_storage')?.patchValue(res.data.details[2]?.max_limit);
        this.resourceQuotaForm.get('storage.unit')?.setValue(res.data.details[2]?.unit);
        }, 
       error => {
        console.error('Error:', error);
      });
  }

  roundToOneDecimal(value: any): number {
    if (value % 1 !== 0) {
      return parseFloat(value.toFixed(1));
    }
    return value;
  }

  updateRAM(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.resourceQuotaForm.get('current_ram')?.patchValue(Number(value));
  }

  updateCPU(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.resourceQuotaForm.get('current_cpu')?.patchValue(Number(value));
  }

  updateStorage(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.resourceQuotaForm.get('current_storage')?.patchValue(Number(value));
  }

  onSubmit(): void {
    console.log(this.resourceQuotaForm.value);
  }

}
