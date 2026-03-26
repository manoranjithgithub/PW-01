import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup, Validators, FormBuilder, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { DeploymentsService } from '../deployment.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { RawEditorComponent } from '../../../shared/components/raw-editor/raw-editor.component';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { PermissionService } from '../../../shared/services/permission.service';

@Component({
  selector: 'app-environment-variables',
  standalone: true,
  imports: [RawEditorComponent, SHARED_IMPORTS, ModalComponent],
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
  isBuilding: boolean = false;
  deploymentId: string = '';

  constructor(private fb: FormBuilder, private deploymentsService: DeploymentsService,
   private toaster: ToastrService, private modalService: NgbModal,
    private ac: ActivatedRoute, public permissionService: PermissionService
  ) {
    this.storedEnvironment = JSON.parse(localStorage.getItem('environment') || '{}');
  }

  ngOnInit() {
    this.freezeAddNewData = this.currentStatus && this.currentStatus?.toLowerCase() === 'building' ? true : false;
    this.isBuilding = this.currentStatus?.toLowerCase() === 'building' ? true : false;
    const resourceUsage = JSON.parse(localStorage.getItem('resourceUsage') || '[]');

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
          const freezeAddNewData = res.data?.status.toLowerCase() === 'stopped' || this.currentStatus?.toLowerCase() === 'building' ? true : false;
          const shouldDisable = freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
          this.freezeAddNewData = shouldDisable;
          this.isBuilding = this.currentStatus?.toLowerCase() === 'building' ? true : false;
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
      name: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9._-]+$'), this.duplicateNameValidator.bind(this)]],
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
    this.editIndex = null;
    if (this.showNewVariableForm) {
      this.rulesFormArray.clear();
      this.addRule();
    }
  }

  addVariable() {
    if (!this.newVariableForm.valid) {
      // Mark all fields as dirty to show validation errors
      this.rulesFormArray.controls.forEach((group: AbstractControl) => {
        const formGroup = group as FormGroup;
        Object.keys(formGroup.controls).forEach((key: string) => {
          const control = formGroup.get(key);
          if (control) {
            control.markAsDirty();
            control.markAsTouched();
          }
        });
      });
      return;
    }

    this.showNewVariableForm = false;
    const rules = this.newVariableForm.value.rules;

    if (this.editIndex !== null && this.editIndex >= 0) {
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

  get submitVariableButtonLabel(): string {
    return this.editIndex !== null && this.editIndex >= 0 ? 'Update' : 'Add Env to List';
  }
  
  openRawEditor() {
    this.rawEditorModel.open();
  }
  closeModal(data: any) {
    this.rawEditorModel.dismiss();
  }

  onVariablesUpdated(updated: { EnvVariable: string; Value: string }[]) {
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

  duplicateNameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }
    
    const isDuplicate = this.envList.some((env: any) => env.EnvVariable === value);
    return isDuplicate ? { duplicateName: true } : null;
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
          this.addEnvVariables(this.envList);
        }
      });
  }

  private loadEnvironmentVariables(): void {
    this.envList = [];
    
    if (this.storedEnvironment && this.canAddVariables && this.deploymentdetails) {
      // this.deploymentsService
      //   .getConfigList(this.storedEnvironment.id, this.deploymentdetails.name)
      //   .subscribe((res: any) => {
      const envVariables = this.mapEnvVariables(this.deploymentdetails.environment || {});
      this.envList = envVariables;
      //   });
    }

    if (!this.canAddVariables && this.envDataFromParent?.data) {
      const envVariables = this.mapEnvVariables(this.envDataFromParent.data);
      this.envList = envVariables;
    }
  }
  savePendingFormData(): void {
    if (this.showNewVariableForm && this.newVariableForm.valid) {
      this.addVariable();
    }
  }

  createEnvironmentVariable() {
    if (!this.updatedReq) {
      return
    }
    const req = {
      environment: this.updatedReq?.data || {},
    }
    this.deploymentsService.updateDeployment(this.deploymentId, req).subscribe({
      next: (res: any) => {
        this.envList = this.mapEnvVariables(res.data.environment || {});
        this.deploymentdetails.environment = res.data.environment || {};
        this.toaster.success('Environment variables updated successfully');
      },
      error: (err) => {
        this.toaster.error(err);
      }
    });
   
  }
}
