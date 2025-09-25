import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormField, ResourceInfo } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  ContainerComponent, ShadowOnScrollDirective, CardGroupComponent, CardComponent, CardBodyComponent, FormCheckInputDirective, FormCheckLabelDirective, AlertComponent
} from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { MarkdownModule } from 'ngx-markdown';
import { Subscription } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToolsService } from '../tools.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { placements } from '@popperjs/core';

@Component({
  selector: 'app-edit-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ContainerComponent, ShadowOnScrollDirective,
    CardGroupComponent, CardComponent, CardBodyComponent, MarkdownModule, LoaderComponent, ModalComponent, AlertComponent],
  templateUrl: './edit-tool.component.html',
  styleUrl: './edit-tool.component.scss',
  providers: [ToolsService]
})
export class EditToolComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  formStructure: FormField[] = [];
  submitted: boolean = false;
  env: string = '';
  toolDetails: any;
  toolName: string = '';
  private subscription: Subscription = new Subscription();
  viewdata: any;
  toolViewName: any;
  paramsEdit: any;
  resourceAllocationDetails: any;
  overprovisioned: boolean = false;
  underprovisioned: boolean = false;
  hide: { [key: string]: boolean } = {};
  selectedResource: ResourceInfo = { cpu: '', memory: '', price: 0 };
  resources: any[] = [];

  constructor(private http: ToolsService, private ac: ActivatedRoute,
    private route: Router, private fb: FormBuilder, private toastr: ToastrService,
    private sharedService: SharedService
  ) {
    this.form = this.fb.group({})
    // const storedValue = this.sharedService.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.env = JSON.parse(storedValue).id;
      console.log('envedit', this.env);
    }
    this.ac.queryParams.subscribe(params => {
      this.toolName = params['id'];
      this.paramsEdit = params['selectedEdit'];
    })
  }

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.route.navigate(['/tools']);
    });
    this.viewToolDetails();
    this.getToolsResourceAllocation()
    this.http.getInstanceTypes().subscribe((res: any) => {
      this.resources = Object.entries(res.data).map(([key, value]) => ({
        name: key.trim(),
        ...(value as object),
      }));
    })
  }

  getToolsResourceAllocation() {
    // const deploymentId = `${this.toolName}_${this.env}`;
    // this.http.getToolsResourceAllocation(this.paramsEdit, this.env).subscribe((res: any) => {
    //   if (res.status === "Success") {
    //     this.resourceAllocationDetails = res.data;
    //     if (this.resourceAllocationDetails) {
    //       if (this.resourceAllocationDetails.deployment_state === 'overprovisioned') {
    //         this.overprovisioned = true;
    //         this.underprovisioned = false;
    //       }
    //       else if (this.resourceAllocationDetails.deployment_state === 'underprovisioned') {
    //         this.overprovisioned = false;
    //         this.underprovisioned = true;
    //       }
    //       else {
    //         this.overprovisioned = false;
    //         this.underprovisioned = false;
    //       }
    //     }
    //   }
    // });
  }



  private lowercaseValidator(control: FormControl) {
    const value = control.value;
    return /^[a-z-]+$/.test(value) ? null : { lowercase: true };
  }

  private gigabyteValidator(control: FormControl) {
    const value = control.value;
    const regex = /^\d+(\.\d+)?$/;
    if (value && !regex.test(value)) {
      return { gigabyteValidator: true };
    }
    return null;
  }

  private passwordValidator(control: FormControl) {
    const value = control.value || '';
    const errors: any = {};
    if (value.length < 8) {
      errors.minLength = true;
    }
    if (!/[a-zA-Z]/.test(value)) {
      errors.letter = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=`~;]/.test(value)) {
      errors.specialChar = true;
    }
    if (!/[0-9]/.test(value)) {
      errors.number = true;
    }
    if (/\s/.test(value)) {
      errors.noSpaces = true;
    }
    return Object.keys(errors).length ? errors : null;
  }

  createForm(fields: { [key: string]: FormField }): void {
    const group: { [key: string]: FormControl } = {};
    this.formStructure = [];
    for (const key in fields) {
      if (fields.hasOwnProperty(key)) {
        const field = fields[key];
        console.log('field', field)
        const validators = [Validators.required];
        if (
          field.key === 'name'
        ) {
          validators.push(this.lowercaseValidator);
        }

        if (field.type === 'password') {
          this.hide[field.key] = true;
        }

        if (field.validation?.regex) {
          validators.push(this.regexValidator(new RegExp(field.validation.regex), field.validation.error_message));
        }

        const initialValue = field.value || field.default_value || '';
        if(field.label === 'Instance Type') {
          this.selectedResource = this.resources.find(resource => resource.name === initialValue) || { cpu: '', memory: '', price: 0 };
        }
        const control = new FormControl(initialValue, validators);
        group[field.key] = control;
        this.formStructure.push(field);
      }
    }
    this.form = this.fb.group(group);
  }

  addNameField(schema: FormField): any {
    console.log('schema-addNameField', schema);
    return {
      name: {
        key: 'name',
        type: 'text',
        label: 'Name',
        children: {},
        depends_on: null,
        default_value: '',
        value: this.toolDetails.name,
        placeholder: '',
      },
      ...schema
    };
  }

  viewToolDetails() {
    this.http.getToolDetailsById(this.env, this.paramsEdit).subscribe((res: any) => {
      this.toolDetails = res;
      console.log('toolDetails', this.toolDetails);
      this.toolViewName = this.toolDetails.data.name;
      this.viewdata = this.toolDetails.data.schema;
      this.submitted = false;

      const schema = this.toolDetails.data.schema;
      const modifiedSchema = this.addNameViewField(schema);
      this.createForm(modifiedSchema);

      const keysToClean = [
        'mysql.primary.persistance.size',
        'postgresql.primary.persistence.size',
        'mongodb.persistence.size',
        'postgresql.readReplicas.persistence.size'
      ];

      const finalSchema = JSON.parse(JSON.stringify(schema));

      keysToClean.forEach(key => {
        if (finalSchema[key]) {
          finalSchema[key].value = finalSchema[key].value.replace(/Gi$/, '');
        }
      });

      console.log('Final schema to send:', finalSchema);
      const modifiedSchemaValue = this.addNameViewField(finalSchema);
      this.createForm(modifiedSchemaValue);

    });
  }

  onSubmit(): void {
    const { name, ...formValues } = this.form.getRawValue();
    if (this.form.valid) {
      const sizeFields = [
        'mysql.primary.persistance.size',
        'postgresql.primary.persistence.size',
        'mongodb.persistence.size',
        'postgresql.readReplicas.persistence.size'
      ];
      sizeFields.forEach(key => {
        if (formValues.hasOwnProperty(key)) {
          formValues[key] = formValues[key] + 'Gi';
        }
      });
      const req = {
        name: name,
        chart: this.toolDetails.data.chart,
        version: this.toolDetails.data.version,
        repository: this.toolDetails.data.repository,
        values: formValues,
        environmentId: this.env
      }
      if (this.paramsEdit) {
        this.http.updateTools(req).subscribe((res: any) => {
          if (res.status) {
            this.toastr.success('Updated successfully!');
          }
        })
      }

    } else {
      this.submitted = true;
      return
    }
  }

  showToolsTable() {
    this.route.navigate(['/tools'])
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  addNameViewField(schema: FormField): any {
    return {
      name: {
        key: 'name',
        type: 'disabled',
        label: 'Name',
        children: {},
        depends_on: null,
        default_value: '',
        value: this.toolDetails.data.name
      },
      ...schema
    };
  }

  regexValidator(pattern: RegExp, errorMessage: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      return pattern.test(control.value) ? null : { regex: errorMessage };
    };
  }

  toggleVisibility(key: string): void {
    this.hide[key] = !this.hide[key];
  }
  onFieldChange(event: Event, field: any) {
    const value = (event.target as HTMLSelectElement).value;
    if (field === 'Instance Type') {
      console.log('Selected value:', value);
      this.selectedResource = this.resources.find(resource => resource.name === value);
    }
  }
}
