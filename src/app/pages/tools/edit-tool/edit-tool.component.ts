import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormField, ResourceInfo } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { ShadowOnScrollDirective } from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { MarkdownModule } from 'ngx-markdown';
import { Subscription } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToolsService } from '../tools.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';

@Component({
  selector: 'app-edit-tool',
  standalone: true,
  imports: [ShadowOnScrollDirective, MarkdownModule, LoaderComponent, ModalComponent, SHARED_IMPORTS],
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
  hide: { [key: string]: boolean } = {};
  selectedResource: ResourceInfo = { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 };
  resources: any[] = [];

  constructor(private http: ToolsService, private ac: ActivatedRoute,
    private route: Router, private fb: FormBuilder, private toastr: ToastrService,
    private sharedService: SharedService
  ) {
    this.form = this.fb.group({})
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.env = JSON.parse(storedValue).id;
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
    this.http.getInstanceTypes().subscribe((res: any) => {
      this.resources =res.data;
    })
  }

  private lowercaseValidator(control: FormControl) {
    const value = control.value;
    return /^[a-z-]+$/.test(value) ? null : { lowercase: true };
  }

  createForm(fields: { [key: string]: FormField }): void {
    const group: { [key: string]: FormControl } = {};
    this.formStructure = [];
    for (const key in fields) {
      if (fields.hasOwnProperty(key)) {
        const field = fields[key];
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
        if (field.label === 'Instance Type') {
          this.selectedResource = this.resources.find(resource => resource.instanceType === initialValue) || { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 };
        }
        const control = new FormControl(initialValue, validators);
        group[field.key] = control;
        this.formStructure.push(field);
      }
    }
    this.form = this.fb.group(group);
  }

  addNameField(schema: FormField): any {
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
        update: this.viewdata.update || false
      },
      ...schema
    };
  }

  viewToolDetails() {
    this.http.getToolDetailsById(this.env, this.paramsEdit).subscribe((res: any) => {
      this.toolDetails = res;
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
        value: this.toolDetails.data.name,
        update: this.viewdata.update || false
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
      this.selectedResource = this.resources.find(resource => resource.instanceType === value);
    }
  }
}
