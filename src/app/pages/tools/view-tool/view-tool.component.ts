import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormField, ResourceInfo, } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { LayoutActionService } from '../../../shared/services/layout-action.service';
import { PermissionService } from '../../../shared/services/permission.service';

@Component({
  selector: 'app-view-tool',
  standalone: true,
  imports: [ShadowOnScrollDirective, MarkdownModule, LoaderComponent, ModalComponent, ToolNetworkingViewComponent, SHARED_IMPORTS],
  templateUrl: './view-tool.component.html',
  styleUrl: './view-tool.component.scss',
  providers: [ToolsService]
})
export class ViewToolComponent implements OnInit, OnDestroy {
  @ViewChild('showToolsModel') public showToolsModel!: ModalComponent;
  form!: FormGroup;
  formStructure: FormField[] = [];
  submitted: boolean = false;
  env: string = '';
  toolDetails: any;
  toolName: string = '';
  private subscription: Subscription = new Subscription();
  selectedTool: boolean = true;
  selectedView: any;
  viewdata: any;
  toolViewName: any;
  hide: { [key: string]: boolean } = {};
  selectedResource: ResourceInfo = { cpuVcpu: '', memoryGb: '', instanceHourRate: 0, currency: '' };
  resources: any[] = [];
  selectedTabIndex: number = 0;


  get hourlyInstanceRate(): number {
    return Number(this.selectedResource?.instanceHourRate ?? 0);
  }

  get monthlyInstanceRate(): number {
    return this.hourlyInstanceRate * 730;
  }
  private destroy$ = new Subject<void>();
  toolStatus: string = '';

  constructor(private http: ToolsService, private ac: ActivatedRoute,
    private route: Router, private fb: FormBuilder,
    private sharedService: SharedService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private layoutActionService: LayoutActionService,
    public permissionService: PermissionService
  ) {
    this.form = this.fb.group({})
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.env = JSON.parse(storedValue).id;
    }
    this.ac.queryParams.subscribe(params => {
      this.selectedView = params['selectedView'] ?? params['id'];
      this.toolName = params['id'] ?? this.selectedView ?? this.toolName;
      this.toolStatus = params['status'];
    })
  }
  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.route.navigate(['/tools']);
    });
    this.viewToolDetails();

    this.http.getInstanceTypes().subscribe((res: any) => {
      this.resources = res.data;
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


  createForm(fields: { [key: string]: FormField }): void {
    const group: { [key: string]: FormControl } = {};
    this.formStructure = [];
    for (const key in fields) {
      if (fields.hasOwnProperty(key)) {
        if (fields[key].ui) {
          const field = fields[key];
          const controlKey = field.key ?? key;

          if (field.type === 'password') {
            this.hide[field.key] = true;
          }

          const initialValue = field.value || field.default_value || '';
          const control = new FormControl({ value: initialValue, disabled: true });
          group[controlKey] = control;
          if (field.label === 'Instance Type') {
            this.selectedResource = this.resources.find(resource => resource.instanceType === initialValue) || { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 };
          }
          this.formStructure.push(field);
        }
      }
    }
    this.form = new FormGroup(group);
    try {
      this.form.disable({ emitEvent: false });
    } catch (e) {
      Object.keys(this.form.controls).forEach(k => this.form.controls[k].disable());
    }
    Object.keys(this.form.controls).forEach(k => {
      try {
        this.form.controls[k].disable({ emitEvent: false });
      } catch (e) {
        this.form.controls[k].disable();
      }
    });
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
        ui: true
      },
      ...schema
    };
  }

  showToolsTable() {
    this.route.navigate(['/tools'])
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this.layoutActionService.clearExtraTitle();
  }

  showTools(): void {
    this.showToolsModel.open();
  }

  viewToolDetails() {
    this.http.getToolDetailsById(this.env, this.selectedView).subscribe((res: any) => {
      this.toolDetails = res;
      this.toolViewName = this.toolDetails.data.name;
      this.viewdata = this.toolDetails.data.schema;
      this.submitted = false;
      this.layoutActionService.setExtraTitle(
        `${this.toolViewName} (${this.toolDetails.data.status})`
      );
      const modifiedSchema = this.addNameViewField(this.viewdata);
      this.createForm(modifiedSchema);
    });
  }

  addNameViewField(schema: FormField): any {
    return {
      name: {
        key: 'name',
        type: 'text',
        label: 'Name',
        children: {},
        depends_on: null,
        default_value: '',
        value: this.toolDetails.data.name,
        ui: true
      },
      ...schema
    };
  }

  toggleVisibility(key: string): void {
    this.hide[key] = !this.hide[key];
  }
  formatCurrency(value: any | undefined, fromCurrency?: string): string {
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
          .deleteTools(this.env, this.selectedView)
          .subscribe((res: any) => {
            if (res.status.toLowerCase() === 'success') {
              this.toastr.success('Tool deleted successfully');
              this.route.navigate(['/tools']);
            }
          });
      }
    });
  }
  editTool() {
    this.route.navigate(['/tools/edit-tool'], { queryParams: { selectedEdit: this.toolName } });
  }
}
