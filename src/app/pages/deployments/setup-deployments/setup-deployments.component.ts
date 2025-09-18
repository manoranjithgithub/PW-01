import { Component, ViewChild, OnInit } from '@angular/core';
import {MatStepperModule} from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import {
  ContainerComponent, ShadowOnScrollDirective, InputGroupComponent, InputGroupTextDirective,
  FormControlDirective, CardGroupComponent, CardComponent, CardBodyComponent, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
} from '@coreui/angular';
import { CreateEndpointsComponent } from '../../endpoints/create-endpoints/create-endpoints.component';
import { Location, NgFor, NgIf } from '@angular/common';
import { SharedService } from '../../../shared/services/shared.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-setup-deployments',
    standalone:true,
    imports: [MatStepperModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule, ContainerComponent, ShadowOnScrollDirective, InputGroupComponent, InputGroupTextDirective,
        FormControlDirective, CardGroupComponent, CardComponent, CardBodyComponent, FormCheckInputDirective,
        FormCheckLabelDirective, FormDirective, FormCheckComponent, CreateEndpointsComponent, NgFor, NgIf, CommonModule],
    templateUrl: './setup-deployments.component.html',
    styleUrl: './setup-deployments.component.scss'
})
export class SetupDeploymentsComponent implements OnInit {
  @ViewChild(CreateEndpointsComponent) childComponent!: CreateEndpointsComponent;
  
  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  thirdFormGroup!: FormGroup;
  fourthFormGroup!: FormGroup;
  fifthFormGroup!:FormGroup;
  repo: string = '';
  repoUrl:string = '';
  showButtonInChild = false;
  tableTheme = 'ag-theme-alpine';
  hasEnvVar:boolean = false;
  hasNoEnvVarString:string ="No environment variables to display. To add new, click the 'Add new key' button below.";
  hasVolume: boolean = false;
  hasNoVolumeString:string ="No volumes to display. To add a new volume, click the 'Add new volume' button below.";
  costComputation:string = '(512MB,240m) $6';
  endpointName :string = '';
  showAuthentication:string = '';
  hostName:string = '';

  resourceTypes = ['Nano', 'Micro', 'Small', 'Medium', 'Large', 'Xlarge'];
  resourceClasses = ['Regular', 'Memory', 'Compute'];

  costMapping: {
    [key in typeof this.resourceTypes[number]]: {
      [key in typeof this.resourceClasses[number]]: string;
    };
  } = {
    Nano: {
      Regular: '(512MB,240m) $6',
      Memory: '(512MB,190m) $4.8',
      Compute: '(512MB,300m) $7'
    },
    Micro: {
      Regular: '(1G,512m) $12',
      Memory: '(1G,350m) $9.6',
      Compute: '(1G,700m) $14'
    },
    Small: {
      Regular: '(2G,1c) $24',
      Memory: '(2G,800m) $19.2',
      Compute: '(2G,1.2c) $28'
    },
    Medium: {
      Regular: '(4G,2c) $48',
      Memory: '(4G,1.5c) $38.4',
      Compute: '(4G,2.5c) $56'
    },
    Large: {
      Regular: '(8G,4c) $96',
      Memory: '(8G,3c) $76.8',
      Compute: '(8G,5c) $112'
    },
    Xlarge: {
      Regular: '(16G,6c) $192',
      Memory: '(16G,4c) $153.6',
      Compute: '(16G,8c) $224'
    }
  };
  

  constructor(private _formBuilder: FormBuilder, private location:Location, private shared:SharedService) { 
    // this.tableTheme = this.shared.getCookie('theme');
    this.tableTheme = localStorage.getItem('theme') || 'ag-theme-alpine';
  }

  ngOnInit() {
    this.shared.valueChange$.subscribe(value => {
      this.tableTheme = value;
    });

    const navigation = this.location.getState() as string;
    console.log(navigation);
    const stateObj = navigation as { repoName?: string, repoUrl?:string };

    if (stateObj?.repoName) {
      this.repo = stateObj.repoName;
    } else {
      this.repo = '';
    } 

    if (stateObj?.repoUrl) {
      this.repoUrl = stateObj.repoUrl;
    } else {
      this.repoUrl = '';
    }
    this.firstFormGroup = this._formBuilder.group({
      name: ['',Validators.required],
      replicaCount: ['1',[Validators.required, this.notZeroValidator()]],
      resourceType:[this.resourceTypes[0],Validators.required],
      resourceClass:[this.resourceClasses[0],Validators.required],
      ephemeralStorage:['2Gi',Validators.required],
      repoName:[{ value: this.repo, disabled: true }],
      cloneUrl:[{ value: this.repoUrl, disabled: true }]
    });
    this.secondFormGroup = this._formBuilder.group({
      data: this._formBuilder.array([])
    });
    this.thirdFormGroup = this._formBuilder.group({
      volumeData: this._formBuilder.array([])
    });
    this.fourthFormGroup = this._formBuilder.group({

    })
    this.fifthFormGroup = this._formBuilder.group({
      data: this._formBuilder.array([]),
      volumeData: this._formBuilder.array([])
    });

  }

   notZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isZero = control.value === '0';
      return isZero ? { notZero: true } : null;
    };
  }
  
  onSubmit(){
    console.log("Child Form Values: ", this.childComponent.endpointForm.value);
    this.endpointName = this.childComponent.endpointForm.value.name;
    this.showAuthentication = this.childComponent.endpointForm.value.showAuthentication;
    this.hostName = this.childComponent.endpointForm.get('host')?.value;
  }
  
  getCostDetails(): string {
    const resourceType = this.firstFormGroup.get('resourceType')?.value;
    const resourceClass = this.firstFormGroup.get('resourceClass')?.value;
    const selectedCost = this.costMapping[resourceType]?.[resourceClass];
    return selectedCost || '';
  }

  onDropdownChange(): void {
    this.costComputation = this.getCostDetails();
  }

  get data(): FormArray {
      return this.secondFormGroup.get('data') as FormArray;
    }

  get volumeData(): FormArray {
      return this.thirdFormGroup.get('volumeData') as FormArray;
    }

    get replicaCount() {
      return this.firstFormGroup.get('replicaCount');
    }

  createDataGroup(): FormGroup {
    return this._formBuilder.group({
      key: ['Key1'],
      value: ['Value1']
    });
  }

  createVolumeDataGroup():FormGroup{
    return this._formBuilder.group({
      name: ['Data'],
      storage:['2Gi'],
      folderPath:['/data']
    })
  }

  addData(): void {
    this.data.push(this.createDataGroup());
    this.hasEnvVar = true;
  }

  addVolumeData() : void{
    this.volumeData.push(this.createVolumeDataGroup());
    this.hasVolume = true;
  }

  removeData(index: number): void {
    
    const dataFormArray = this.data;
    dataFormArray.removeAt(index);
   if(dataFormArray.length === 0)
    this.hasEnvVar = false;
  }

  removeVolume(index:number):void
  {
    const dataFormArray = this.volumeData;
    dataFormArray.removeAt(index);
    if(dataFormArray.length === 0)
      this.hasVolume = false;
  }
}



