import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormField, ResourceInfo, } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  selector: 'app-view-tool',
  standalone: true,
  imports: [ShadowOnScrollDirective, MarkdownModule, LoaderComponent, ModalComponent, SHARED_IMPORTS],
  templateUrl: './view-tool.component.html',
  styleUrl: './view-tool.component.scss',
  providers: [ToolsService]
})
export class ViewToolComponent implements OnInit, OnDestroy {
  @ViewChild('showToolsModel') private showToolsModel!: ModalComponent;
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
  selectedResource: ResourceInfo = { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 };
  resources: any[] = [];


  constructor(private http: ToolsService, private ac: ActivatedRoute,
    private route: Router, private fb: FormBuilder,
    private sharedService: SharedService
  ) {
    this.form = this.fb.group({})
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.env = JSON.parse(storedValue).id;
    }
    this.ac.queryParams.subscribe(params => {
      this.toolName = params['id'];
      this.selectedView = params['selectedView'];
      this.toolName = this.selectedView;
    })
  }
  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.route.navigate(['/tools']);
    });
    this.viewToolDetails();

    this.http.getInstanceTypes().subscribe((res: any) => {
      this.resources = res.data;
    })
  }


  createForm(fields: { [key: string]: FormField }): void {
    const group: { [key: string]: FormControl } = {};
    this.formStructure = [];
    for (const key in fields) {
      if (fields.hasOwnProperty(key)) {
        if (fields[key].ui) {
          const field = fields[key];

          if (field.type === 'password') {
            this.hide[field.key] = true;
          }

          const initialValue = field.value || field.default_value || '';
          const control = new FormControl({ value: initialValue, disabled: true });
          group[field.key] = control;
          group[field.key] = control;
          if (field.label === 'Instance Type') {
            this.selectedResource = this.resources.find(resource => resource.instanceType === initialValue) || { cpuVcpu: '', memoryGb: '', instanceHourRate: 0 };
          }
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
        ui:true
      },
      ...schema
    };
  }

  showToolsTable() {
    this.route.navigate(['/tools'])
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
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
        ui:true
      },
      ...schema
    };
  }

  toggleVisibility(key: string): void {
    this.hide[key] = !this.hide[key];
  }

}
