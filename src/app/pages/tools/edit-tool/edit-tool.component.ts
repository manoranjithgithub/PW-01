import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormField, ResourceInfo } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { ShadowOnScrollDirective } from '@coreui/angular';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { MarkdownModule } from 'ngx-markdown';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToolsService } from '../tools.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { ToolNetworkingViewComponent } from '../tools-networking/tool-networking-view.component';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { ToolMonitoringComponent } from '../tool-monitoring/tool-monitoring.component';
import { ToolMetricsComponent } from '../tool-metrics/tool-metrics.component';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-edit-tool',
  standalone: true,
  imports: [ShadowOnScrollDirective, MarkdownModule, LoaderComponent, ModalComponent, SHARED_IMPORTS, ToolNetworkingViewComponent, ToolMonitoringComponent, ToolMetricsComponent],
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
  private subscription: Subscription = new Subscription();
  viewdata: any;
  toolViewName: any;
  paramsEdit: any;
  hide: { [key: string]: boolean } = {};
  selectedResource: { [key: string]: ResourceInfo | undefined } = { key: { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 } };
  resources: any[] = [];
  selectedTabIndex: number = 0;
  deploymentId: string = '';

  get hourlyInstanceRate(): number {
    const resource = Object.values(this.selectedResource).find(res => res?.instanceHourRate);
    return resource ? Number(resource.instanceHourRate) : 0;
  }

  get monthlyInstanceRate(): number {
    return this.hourlyInstanceRate * 730;
  }
  private destroy$ = new Subject<void>();
  private statusPollInterval?: any;

  constructor(private http: ToolsService, private ac: ActivatedRoute,
    private route: Router, private fb: FormBuilder, private toastr: ToastrService,
    private sharedService: SharedService,
    private modalService: NgbModal,
    private layoutActionService: LayoutActionService,
    private userService: UserService
  ) {
    this.form = this.fb.group({})
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.env = JSON.parse(storedValue).id;
    }
    this.ac.queryParams.subscribe(params => {
      this.paramsEdit = params['selectedEdit'];
      const status = params['status'] || '';
      this.deploymentId = params['id'] || '';
      // this.layoutActionService.setExtraTitle(
      //   `${this.paramsEdit} (${status})`
      // );
    })
  }

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.route.navigate(['/tools']);
    });
    this.viewToolDetails();
    this.http.getInstanceTypes().subscribe((res: any) => {
      const items = Array.isArray(res?.data) ? res.data.slice() : [];
      items.sort((a: any, b: any) => {
        const pa = parseFloat(String(a.price || a.instanceHourRate || '').replace(/[^0-9.]/g, '')) || 0;
        const pb = parseFloat(String(b.price || b.instanceHourRate || '').replace(/[^0-9.]/g, '')) || 0;
        return pa - pb;
      });
      this.resources = items;
    });
    this.layoutActionService.actionClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onLayoutButtonClick();
      });
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
  }

  private lowercaseValidator(control: FormControl) {
    const value = control.value;
    return /^(?!\\d)(?!.*[-]{2})(?!.*[A-Z])[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? null : { lowercase: true };
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

          if (field.append === 'Gi') {
            validators.push(this.gigabyteValidator);
          }

          const initialValue = field.value || field.default_value || '';
          if (field.function === 'resource') {
            this.selectedResource[field.label] = this.resources.find(resource => resource.instanceType === initialValue) || { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 };
          }
          const control = new FormControl(initialValue, validators);
          group[field.key] = control;
          this.formStructure.push(field);
        }
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
        update: this.viewdata.update || false,
        ui: true
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
      this.layoutActionService.setExtraTitle(
        `${this.toolViewName} (${this.toolDetails.data.status})`
      );
      const schema = this.toolDetails.data.schema;
      const modifiedSchema = this.addNameViewField(schema);
      this.createForm(modifiedSchema);

      const finalSchema = JSON.parse(JSON.stringify(schema));

      Object.keys(finalSchema).forEach(key => {
        const field = finalSchema[key];
        if (field.append && field.value) {
          field.value = field.value.replace(new RegExp(field.append + '$'), '');
        }
      });

      const modifiedSchemaValue = this.addNameViewField(finalSchema);
      this.createForm(modifiedSchemaValue);
      this.startStatusPolling();
    });
  }

  onSubmit(): void {
    const { name, ...formValues } = this.form.getRawValue();
    if (this.form.valid) {
      this.formStructure.forEach(field => {
        if (field.append && formValues.hasOwnProperty(field.key)) {
          formValues[field.key] = formValues[field.key] + field.append;
        }
      });
      const req: any = {
        name: name,
        chart: this.toolDetails.data.chart,
        version: this.toolDetails.data.version,
        repository: this.toolDetails.data.repository,
        values: formValues,
        environmentId: this.env,
      }
      if (this.toolDetails.data.publicHost) {
        req['exposePublicly'] = true;
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

  onGenerateHost() {
    const { name, ...formValues } = this.form.getRawValue();
    try {
      const req = {
        name: name,
        chart: this.toolDetails.data.chart,
        version: this.toolDetails.data.version,
        repository: this.toolDetails.data.repository,
        values: formValues,
        environmentId: this.env,
        exposePublicly: true
      }
      if (this.paramsEdit) {
        this.http.updateTools(req).subscribe((res: any) => {
          if (res.status) {
            this.toastr.success('Host generated successfully!');
            this.route.navigate(['/tools']);
          }
        })
      }
    } catch (e) {
      console.error(e);
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this.layoutActionService.clearExtraTitle();
    this.stopStatusPolling();
  }

  private getToolStatus() {
    if (!this.deploymentId) return;

    const envId = localStorage.getItem('environment');
    if (!envId) return;

    const envObj = JSON.parse(envId);
    const req = {
      "environmentId": envObj.id,
      "workloadIds": [this.deploymentId],
      "type": "tool"
    };

    this.userService.getDeploymentStatus(req).subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const statusItem = res.data.find((item: any) => item.deploymentId === this.deploymentId || item.id === this.deploymentId);
          if (statusItem && this.toolDetails) {
            const newStatus = statusItem.status || 'not available';
            if (this.toolDetails.data.status !== newStatus) {
              this.toolDetails.data.status = newStatus;
              this.layoutActionService.setExtraTitle(
                `${this.toolViewName} (${newStatus})`
              );
            }
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching tool status', err);
      }
    });
  }

  private startStatusPolling() {
    if (this.statusPollInterval) return;
    this.getToolStatus();
    this.statusPollInterval = setInterval(() => {
      this.getToolStatus();
    }, 12000);
  }

  private stopStatusPolling() {
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
      this.statusPollInterval = undefined;
    }
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.hidden) {
      this.stopStatusPolling();
    } else {
      this.startStatusPolling();
    }
  }

  showToolsTable() {
    this.route.navigate(['/tools'])
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
        update: this.viewdata.update || false,
        ui: true
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
  onFieldChange(event: Event, field: any, label: string): void {
    const value = (event.target as HTMLSelectElement).value;
    if (field === 'resource') {
      this.selectedResource[label] = this.resources.find(resource => resource.instanceType === value);
    }
  }
  'formatCurrency'(value: any | undefined, fromCurrency?: string): string {
    if (value == null || isNaN(Number(value))) return '';
    const target = this.sharedService.getCurrency() || 'USD';
    const converted = this.sharedService.convertAmount(Number(value), fromCurrency, target);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: target,
        minimumFractionDigits: 4
      }).format(converted);
    } catch (e) {
      return String(converted);
    }
  }
  onLayoutButtonClick() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Tool';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(result => {
      if (result) {
        this.http
          .deleteTools(this.env, this.paramsEdit)
          .subscribe((res: any) => {
            if (res.status) {
              this.toastr.success('Deleted successfully!');
              this.route.navigate(['/tools']);
            }
          })
      }
    });
  }
}
