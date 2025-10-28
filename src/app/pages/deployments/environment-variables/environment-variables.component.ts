import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormsModule, FormBuilder, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { AccordionButtonDirective, AccordionComponent, AccordionItemComponent, TemplateIdDirective, CalloutComponent, AlertComponent, DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective } from '@coreui/angular';
import { DeploymentsService } from '../deployment.service';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { RawEditorComponent } from '../../../shared/components/raw-editor/raw-editor.component';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-environment-variables',
  standalone: true,
  imports: [AccordionButtonDirective, AccordionComponent, AccordionItemComponent,
    TemplateIdDirective, CommonModule, ReactiveFormsModule, FormsModule, CalloutComponent, RawEditorComponent,
    AlertComponent, ModalComponent, DropdownComponent, DropdownItemDirective, DropdownMenuDirective,
    DropdownToggleDirective],
  providers: [DeploymentsService],
  templateUrl: './environment-variables.component.html',
  styleUrl: './environment-variables.component.scss'
})
export class EnvironmentVariablesComponent implements OnInit {
  newVariableForm!: FormGroup;
  showNewVariableForm: boolean = false;
  storedEnvironment: any;
  @Input() deploymentdetails: any;

  envList: any = [];

  @ViewChild('rawEditorModel') private rawEditorModel!: ModalComponent;

  public modalConfig: any = {
    modalTitle: 'Raw Editor',
    width: '780px',
    height: 'auto',
    hideDismissButton: () => false,
    hideCloseButton: () => true
  };

  @Output() envDetails = new EventEmitter<any>();
  @Input() deploymentData: any;
  @Input() canAddVariables: boolean = false;
  @Input({ required: false }) envDataFromParent: any;
  deploymentResourceExhausted: boolean = false;
  editIndex: number | null = null;
  updatedReq: any
  isEditEnv: boolean = false;
  @Input() currentStatus: string = '';
  freezeAddNewData: boolean = false;
  deploymentId: string = '';

  constructor(private fb: FormBuilder, private deploymentsService: DeploymentsService,
    private sharedService: SharedService, private toaster: ToastrService, private modalService: NgbModal,
    private ac: ActivatedRoute
  ) {
    // this.storedEnvironment = JSON.parse(this.sharedService.getCookie('environment'));
    this.storedEnvironment = JSON.parse(localStorage.getItem('environment') || '{}');
  }

  ngOnInit() {
    this.freezeAddNewData = this.currentStatus && this.currentStatus?.toLowerCase() === 'building' ? true : false;
    // const resourceUsage = JSON.parse(this.sharedService.getCookie('resourceUsage'));
    const resourceUsage = JSON.parse(localStorage.getItem('resourceUsage') || '[]');
    const deploymentResource = resourceUsage.find(
      (res: any) => res.resource_type === 'config_map'
    );
    this.deploymentResourceExhausted = deploymentResource?.remaining === 0;

    this.newVariableForm = this.fb.group({
      rules: this.fb.array([]),
    });
    this.ac.queryParams.subscribe(params => {
      const deploymentId = params['id'];
      this.deploymentId = deploymentId;

      if (deploymentId) {
        this.isEditEnv = true;
        this.deploymentsService.getDeploymentById(deploymentId).subscribe((res: any) => {
          this.deploymentdetails = this.deploymentData || res.data;
          this.loadEnvironmentVariables();
        });
      } else {
        this.isEditEnv = false;
        this.loadEnvironmentVariables();
        if (this.deploymentData) {
          this.deploymentdetails = this.deploymentData;
        }
      }
    });





  }

  get rulesFormArray(): FormArray {
    return this.newVariableForm.get('rules') as FormArray;
  }

  createRule(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9._-]+$')]],
      value: ['', Validators.required],
    }, { validators: this.nameValueDependencyValidator });
  }

  addRule(): void {
    this.rulesFormArray.push(this.createRule());
  }

  removeRule(index: number): void {
    this.rulesFormArray.removeAt(index);
  }

  cancelVariableForm(): void {
    this.showNewVariableForm = !this.showNewVariableForm;
    if (this.showNewVariableForm) {
      this.rulesFormArray.clear();
      this.addRule();
    }
  }

  addVariable() {
    this.showNewVariableForm = false;
    if (this.newVariableForm.valid) {
      const rules = this.newVariableForm.value.rules;

      if (this.editIndex && this.editIndex >= 0) {
        const updatedVar = {
          EnvVariable: rules[0].name,
          Value: rules[0].value
        };

        this.envList[this.editIndex] = updatedVar;
        this.editIndex = null;
      } else {
        const newVars = rules.map((rule: any) => ({
          EnvVariable: rule.name,
          Value: rule.value
        }));

        this.envList = [...this.envList, ...newVars];
      }

      const uniqueMap = new Map<string, any>();
      this.envList.forEach((item: any) => {
        uniqueMap.set(item.EnvVariable, item);
      });
      this.envList = Array.from(uniqueMap.values());

      this.addEnvVariables(this.envList);
      this.rulesFormArray.clear();
    }
  }

  openRawEditor() {
    this.rawEditorModel.open();
  }
  closeModal(data: any) {
    this.rawEditorModel.dismiss();
  }

  onVariablesUpdated(updated: { EnvVariable: string; Value: string }[]) {
    // console.log('Received from child:', updated);
    this.envList = updated;
    this.addEnvVariables(this.envList);
  }
  addEnvVariables(data: any) {
    this.updatedReq = {
      data: data.reduce((acc: any, item: any) => {
        acc[item.EnvVariable] = item.Value;
        return acc;
      }, {} as { [key: string]: string })
    }
    if (!this.canAddVariables) {
      this.envDetails.emit(this.updatedReq);
      return;
    }

  }
  private mapEnvVariables(data: Record<string, any>): { EnvVariable: string; Value: any }[] {
    return Object.entries(data).map(([key, value]) => ({
      EnvVariable: key,
      Value: value
    }));
  }

  nameValueDependencyValidator(group: AbstractControl): ValidationErrors | null {
    const name = group.get('name')?.value;
    const value = group.get('value')?.value;

    if (!name && !value) return null;
    if (name && !value) {
      return { valueRequired: true };
    }

    return null;
  }

  editDetails(index: number): void {
    const secret = this.envList[index];

    this.showNewVariableForm = true;
    this.editIndex = index;

    this.rulesFormArray.clear();
    this.rulesFormArray.push(this.fb.group({
      name: [secret.EnvVariable, [Validators.required, Validators.pattern('^[A-Za-z0-9_-]+$')]],
      value: [secret.Value, Validators.required]
    }));
  }
  deleteDetails(index: number) {
    const envData = this.envList[index];
    this.editIndex = index;
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'environment variable';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.envList.splice(index, 1);
          this.editIndex = -1;
          const req = {
            environment: this.envList.reduce((acc: any, item: any) => {
              acc[item.EnvVariable] = item.Value;
              return acc;
            }, {} as { [key: string]: string }),

          }
          if (this.deploymentId) {
            this.deploymentsService.updateDeployment(this.deploymentId, req).subscribe({
              next: (res: any) => {
                console.log(res);
                this.envList = this.mapEnvVariables(res.data.environment || {});
              },
              error: (err) => {
                this.toaster.error(err);
              }
            });
          }

          // this.deploymentsService.createConfigdata(this.storedEnvironment?.id, req).subscribe((res: any) => {
          //   console.log(res);
          //   if (res?.status == 'Success') {
          //     this.toaster.success('Deleted successfully!');
          //     this.deploymentsService.getConfigList(this.storedEnvironment?.id, this.deploymentdetails.name).subscribe((res: any) => {
          //       console.log(res);
          //       const envVariables = Object.entries(res.data.data).map(([key, value]) => ({
          //         EnvVariable: key,
          //         Value: value
          //       }));
          //       this.envList = [...envVariables];
          //     })
          //   }
          // })
        }
      });
  }

  private loadEnvironmentVariables(): void {
    if (this.storedEnvironment && this.canAddVariables && this.deploymentdetails) {
      // this.deploymentsService
      //   .getConfigList(this.storedEnvironment.id, this.deploymentdetails.name)
      //   .subscribe((res: any) => {
      const envVariables = this.mapEnvVariables(this.deploymentdetails.environment || {});
      this.envList = [...this.envList, ...envVariables];
      //   });
    }

    if (!this.canAddVariables && this.envDataFromParent?.data) {
      const envVariables = this.mapEnvVariables(this.envDataFromParent.data);
      this.envList = [...this.envList, ...envVariables];
    }
  }
  createEnvironmentVariable() {
    if (this.updatedReq && this.updatedReq.data && Object.keys(this.updatedReq.data).length === 0) {
      return
    }
    const req = {
      environment: this.updatedReq?.data || null,
    }
    this.deploymentsService.updateDeployment(this.deploymentId, req).subscribe({
      next: (res: any) => {
        console.log(res);
      },
      error: (err) => {
        this.toaster.error(err);
      }
    });
    // this.deploymentsService.createConfigdata(this.storedEnvironment?.id, this.updatedReq).subscribe((res: any) => {
    //   console.log(res);
    //   if (res?.status == 'Success') {
    //     this.toaster.success(res.message);
    //     this.deploymentsService.getConfigList(this.storedEnvironment?.id, this.deploymentdetails.name).subscribe((res: any) => {
    //       console.log(res);
    //       const envVariables = Object.entries(res.data.data).map(([key, value]) => ({
    //         EnvVariable: key,
    //         Value: value
    //       }));
    //       this.envList = [...envVariables];
    //     })
    //   }
    // })
  }
}
