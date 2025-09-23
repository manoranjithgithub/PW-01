import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormField, ResourceInfo, } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-view-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ContainerComponent, ShadowOnScrollDirective,
    CardGroupComponent, CardComponent, CardBodyComponent, MarkdownModule, LoaderComponent, ModalComponent, AlertComponent],
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
  overprovisioned: boolean = false;
  underprovisioned: boolean = false;
  resourceAllocationDetails: any;
  hide: { [key: string]: boolean } = {};
  selectedResource: ResourceInfo = { cpu: '', memory: '', price: 0 };
  resources: any[] = [];
  

  constructor(private http: ToolsService, private ac: ActivatedRoute,
    private route: Router, private fb: FormBuilder, private toastr: ToastrService,
    private sharedService: SharedService
  ) {
    this.form = this.fb.group({})
    //const storedValue = this.sharedService.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.env = JSON.parse(storedValue).id;
      console.log('envedit', this.env);
    }
    this.ac.queryParams.subscribe(params => {
      console.log('params', params);
      this.toolName = params['id'];
      this.selectedView = params['selectedView'];
      console.log('selectedView', this.selectedView);
      this.toolName = this.selectedView;
    })
  }
  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.route.navigate(['/tools']);
    });
    this.viewToolDetails();

    this.getToolsResourceAllocation();
    this.http.getInstanceTypes().subscribe((res: any) => {
      this.resources = Object.entries(res.data).map(([key, value]) => ({
        name: key.trim(),
        ...(value as object),
      }));
    })
  }

  getToolsResourceAllocation() {
    // const deploymentId = `${this.toolName}_${this.env}`;
    this.http.getToolsResourceAllocation(this.toolName, this.env).subscribe((res: any) => {
      if (res.status === "Success") {
        this.resourceAllocationDetails = res.data;
        if (this.resourceAllocationDetails) {
          if (this.resourceAllocationDetails.deployment_state === 'overprovisioned') {
            this.overprovisioned = true;
            this.underprovisioned = false;
          }
          else if (this.resourceAllocationDetails.deployment_state === 'underprovisioned') {
            this.overprovisioned = false;
            this.underprovisioned = true;
          }
          else {
            this.overprovisioned = false;
            this.underprovisioned = false;
          }
        }
      }
    });
  }

  createForm(fields: { [key: string]: FormField }): void {
    const group: { [key: string]: FormControl } = {};
    this.formStructure = [];
    for (const key in fields) {
      if (fields.hasOwnProperty(key)) {
        const field = fields[key];

        if (field.type === 'password') {
          this.hide[field.key] = true;
        }

        const initialValue = field.value || field.default_value || '';
        const control = new FormControl({ value: initialValue, disabled: true });
        group[field.key] = control;
        group[field.key] = control;
        console.log(field.label, initialValue)
        if(field.label === 'Instance Type') {
        this.selectedResource = this.resources.find(resource => resource.name === initialValue) || { cpu: '', memory: '', price: 0 };
        }
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
        value: this.toolDetails.name
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
        value: this.toolDetails.data.name
      },
      ...schema
    };
  }

  toggleVisibility(key: string): void {
    this.hide[key] = !this.hide[key];
  }

}
