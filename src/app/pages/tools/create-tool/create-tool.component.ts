import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormField, ResourceInfo, } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
  selector: 'app-create-tool',
  standalone: true,
  imports: [ShadowOnScrollDirective, MarkdownModule, LoaderComponent, ModalComponent, SHARED_IMPORTS],
  templateUrl: './create-tool.component.html',
  styleUrl: './create-tool.component.scss',
  providers: [ToolsService]
})
export class CreateToolComponent implements OnInit, OnDestroy {

  @ViewChild('showToolsModel') private showToolsModel!: ModalComponent;

  form!: FormGroup;
  formStructure: FormField[] = [];
  submitted: boolean = false;
  isShowForm: boolean = false;
  imgList: any = [];
  env: string = '';
  toolDetails: any;
  isInstall: boolean = true;
  toolName: string = '';
  private subscription: Subscription = new Subscription();
  allFieldKeyValues: any = [];
  markdownText: string = '';
  selectedTool: string = '';
  showToolsConfig = {
    modalTitle: 'View details',
    width: '700px',
    height: '416px',
    hideDismissButton: () => false,
    hideCloseButton: () => false
  };
  toolNames: any = [];
  hide: { [key: string]: boolean } = {};
  selectedResource: { [key: string]: ResourceInfo | undefined } = { key: { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 } };
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
      this.toolName = params['name'];
    })
  }

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.route.navigate(['/tools']);
    });
    this.http.getAvailableToolsList().subscribe((res: any) => {
      this.imgList = Object.values(res.data);
    })
    const availableTools = JSON.parse(localStorage.getItem('availableTools') || '{}');
    if (availableTools.length > 0) {
      this.toolNames = availableTools;
    }
    this.http.getInstanceTypes().subscribe((res: any) => {
      const items = Array.isArray(res?.data) ? res.data.slice() : [];
      items.sort((a: any, b: any) => {
        const pa = parseFloat(String(a.price || a.instanceHourRate || '').replace(/[^0-9.]/g, '')) || 0;
        const pb = parseFloat(String(b.price || b.instanceHourRate || '').replace(/[^0-9.]/g, '')) || 0;
        return pa - pb;
      });
      this.resources = items;

    })
  }

  private gigabyteValidator(control: FormControl) {
    const value = control.value;
    const regex = /^\d+(\.\d+)?$/;
    if (value && !regex.test(value)) {
      return { gigabyteValidator: true };
    }
    return null;
  }

  createForm(fields: { [key: string]: FormField }): void {
    const group: { [key: string]: FormControl } = {};

    this.formStructure = [];

    for (const key in fields) {
      if (fields.hasOwnProperty(key)) {
        if (fields[key].ui) {
          const field = fields[key];

          const validators = [Validators.required];
          if (field.key === 'name') {
            validators.push(
              Validators.maxLength(30),
              this.regexValidator(
                new RegExp("^(?!\\d)(?!.*[-]{2})(?!.*[A-Z])[a-z0-9]+(?:-[a-z0-9]+)*$"),
                "Name must not start with a number. Only lowercase letters, numbers, and separators (., -) are allowed. No consecutive separators or uppercase letters. Dots (.) are not allowed"
              ),
              this.uniqueNameValidator(this.toolNames)
            );
            if (this.selectedTool === 'mysql') {
              validators.push((control: AbstractControl) => {
                const value = control.value || '';
                return value.includes('mysql')
                  ? { forbiddenName: 'Name cannot include "mysql".' }
                  : null;
              });
            }
          }

          if (field.validation?.regex) {
            validators.push(this.regexValidator(new RegExp(field.validation.regex), field.validation.error_message));
          }

          if (field.key === 'mysql.primary.persistance.size' ||
            field.key === 'postgresql.primary.persistence.size' ||
            field.key === 'mongodb.persistence.size' ||
            field.key === 'postgresql.readReplicas.persistence.size' ||
            field.key === 'n8n.postgresql.primary.persistence.size'
          ) {
            validators.push(this.gigabyteValidator);
          }

          if (field.type === 'password') {
            this.hide[field.key] = true;
          }
          if (field.function === 'resource') {
            field.default_value = field.options[0];
            this.selectedResource[field.label] = this.resources.find(resource => resource.instanceType === field.options[0]) || { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 };
          }
          const control = new FormControl(field.default_value || '', validators);

          group[field.key] = control;
          this.formStructure.push(field);
        }
      }
    }
    this.form = this.fb.group(group);
  }
  onFieldBlur(fieldKey: string) {
    if (fieldKey === 'name') {
      const nameValue = this.form.get('name')?.value;
      if (fieldKey) {
        this.form.get(fieldKey)?.updateValueAndValidity();
      }
      const nameExists = this.toolNames.some((name: any) => name === nameValue);
    }
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
        options: [],
        validation: {},
        placeholder: '',
        ui: true
      },
      ...schema
    };
  }

  onSubmit(): void {
    const { name, ...formValues } = this.form.getRawValue();

    if (this.form.valid) {
      const sizeFields = [
        'mysql.primary.persistence.size',
        'postgresql.primary.persistence.size',
        'mongodb.persistence.size',
        'postgresql.readReplicas.persistence.size',
        'n8n.postgresql.primary.persistence.size'
      ];

      sizeFields.forEach(key => {
        if (formValues.hasOwnProperty(key)) {
          formValues[key] = formValues[key] + 'Gi';
        }
      });

      const req = {
        name: name,
        chart: this.toolDetails.chart,
        version: this.toolDetails.version,
        repository: this.toolDetails.repository,
        values: formValues,
        environmentId: this.env,
        projectId: JSON.parse(localStorage.getItem('project') || '{}').id
      }
      if (this.env) {
        this.http.createTools(req).subscribe((res: any) => {
          if (res.status) {
            this.toastr.success('Created successfully');
            this.route.navigate(['/tools'])
          }
        })
      }
    }
    else {
      this.submitted = true;
      return
    }
  }

  onImageClick(value: any) {
    this.isInstall = true;
    this.isShowForm = false;
    this.http.getFormDetailsByTool(value.id).subscribe((res: any) => {
      this.toolDetails = res.data;
      this.install()
    });
  }

  install() {
    this.isInstall = false;
    this.isShowForm = true;
    this.submitted = false;
    const modifiedSchema = this.addNameField(this.toolDetails.schema);
    this.createForm(modifiedSchema);
  }

  showToolsTable() {
    this.route.navigate(['/tools'])
  }

  getmarkData(description: any) {
    return description
      .replace(/\\n/g, '\n')
      .replace(/\\#/g, '#');
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  toolsListBack() {
    this.isInstall = true;
    this.isShowForm = false;
  }

  showTools(toolDetails: any): void {
    this.toolDetails = toolDetails;
    this.showToolsModel.open();
  }

  closeTools(): void {
    this.showToolsModel.close();
  }
  regexValidator(pattern: RegExp, errorMessage: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null; // skip empty value
      return pattern.test(control.value) ? null : { regex: errorMessage };
    };
  }

  toggleVisibility(key: string): void {
    this.hide[key] = !this.hide[key];
  }
  onFieldChange(event: Event, field: any, key: string): void {
    const value = (event.target as HTMLSelectElement).value;
    if (field === 'resource') {
      this.selectedResource[key] = this.resources.find(resource => resource.instanceType === value);
      // console.log('Selected resource for key', key, ':', this.selectedResource);
    }
  }
  uniqueNameValidator(existingNames: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const nameExists = existingNames.some(
        name => name.toLowerCase() === control.value.toLowerCase()
      );
      return nameExists ? { uniqueName: true } : null;
    };
  }

  get hourlyInstanceRate(): number {
    const resource = Object.values(this.selectedResource).find(res => res?.instanceHourRate);
    return resource ? Number(resource.instanceHourRate) : 0;
  }

  get monthlyInstanceRate(): number {
    return this.hourlyInstanceRate * 730;
  }
  formatCurrency(value: any | undefined, fromCurrency?: string): string {
    if (value == null || isNaN(Number(value))) return '';
    const target = this.sharedService.getCurrency() || 'USD';
    const converted = this.sharedService.convertAmount(Number(value), fromCurrency, target);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: target,
        minimumFractionDigits: 4,
      }).format(converted);
    } catch (e) {
      return String(converted);
    }
  }
  getInstanceTypes(options: string[]): any[] {
    const items = this.resources.filter(resource =>
      options.includes(resource.instanceType)
    );
    return items;
  }
}


