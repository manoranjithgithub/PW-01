import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormField, ResourceInfo, } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  ContainerComponent, ShadowOnScrollDirective, CardGroupComponent, CardComponent, CardBodyComponent, FormCheckInputDirective, FormCheckLabelDirective
} from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { MarkdownModule } from 'ngx-markdown';
import { Subscription } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToolsService } from '../tools.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
@Component({
  selector: 'app-create-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ContainerComponent, ShadowOnScrollDirective,
    CardGroupComponent, CardComponent, CardBodyComponent, MarkdownModule, LoaderComponent, ModalComponent],
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
      console.log('available tools', res);
      this.imgList = Object.values(res.data);
      // this.selectedTool = this.imgList[0].name;
      // this.onImageClick(this.imgList[0]);
    })
    const availableTools = JSON.parse(localStorage.getItem('availableTools') || '{}');
    if (availableTools) {
       this.toolNames = Object.values(availableTools.data).map((item: any) => item.name);
    }
    this.http.getInstanceTypes().subscribe((res: any) => {
      this.resources = Object.entries(res.data).map(([key, value]) => ({
        name: key.trim(),
        ...(value as object),
      }));
    })
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
    if (value.length < 10) {
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

        const validators = [Validators.required];
        if (field.key === 'name') {
          validators.push(
            Validators.maxLength(30),
            this.regexValidator(
              new RegExp("^(?!\\d)(?!.*[-]{2})(?!.*[A-Z])[a-z0-9]+(?:-[a-z0-9]+)*$"),
              "Name must not start with a number. Only lowercase letters, numbers, and separators (., -) are allowed. No consecutive separators or uppercase letters. Dots (.) are not allowed"
            )
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


        // if (
        //   field.key === 'root_password' ||
        //   field.key === 'auth.password' ||
        //   field.key === 'auth.postgresPassword' ||
        //   field.key === 'auth.rootPassword' ||
        //   field.key === 'auth.replicaSetKey'
        // ) {
        //   validators.push(this.passwordValidator);
        // }

        if (field.key === 'mysql.primary.persistance.size' ||
          field.key === 'postgresql.primary.persistence.size' ||
          field.key === 'mongodb.persistence.size' ||
          field.key === 'postgresql.readReplicas.persistence.size'
        ) {
          validators.push(this.gigabyteValidator);
        }

        if (field.type === 'password') {
          this.hide[field.key] = true;
        }
        if(field.label === 'Instance Type') {
          console.log(field.options[0]);
          field.default_value = field.options[0];
          this.selectedResource = this.resources.find(resource => resource.name === field.options[0]) || { cpu: '', memory: '', price: 0 };
        }
        const control = new FormControl(field.default_value || '', validators);

        group[field.key] = control;
        this.formStructure.push(field);
      }
    }
    this.form = this.fb.group(group);
  }
  onFieldBlur(fieldKey: string) {
    if (fieldKey === 'name') {
      const nameValue = this.form.get('name')?.value;
      // const nameExists = this.toolNames.some((name: any) => name === nameValue);
      this.getToolNameValidation(nameValue);
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
        placeholder: ''
      },
      ...schema
    };
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
        chart: this.toolDetails.chart,
        version: this.toolDetails.version,
        repository: this.toolDetails.repository,
        values: formValues,
        environmentId: this.env
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

  getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  setValueByPath(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    const target = parts.reduce((acc, part) => acc[part] ||= {}, obj);
    target[last] = value;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  toolsBack() {
    this.route.navigate(['/tools']);
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

  getToolNameValidation(name: string) {
    if (this.env && name) {
      this.http.getToolNameValidation(this.env, name).subscribe((res: any) => {
        console.log('res', res);
      });
    }
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

