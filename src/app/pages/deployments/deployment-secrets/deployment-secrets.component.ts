import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AlertComponent, CalloutComponent, CardBodyComponent, CardComponent, CardGroupComponent, DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective } from '@coreui/angular';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { DeploymentsService } from '../deployment.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { RawEditorComponent } from '../../../shared/components/raw-editor/raw-editor.component';
import { MaskPasswordPipe } from '../../../shared/pipes/mask-password.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-deployment-secrets',
  standalone: true,
  imports: [CardBodyComponent, CardComponent, CardGroupComponent, ReactiveFormsModule, CommonModule,
    CalloutComponent, ModalComponent, RawEditorComponent, MaskPasswordPipe, AlertComponent,
    DropdownComponent, DropdownItemDirective, DropdownMenuDirective,
    DropdownToggleDirective
  ],
  providers: [DeploymentsService],
  templateUrl: './deployment-secrets.component.html',
  styleUrl: './deployment-secrets.component.scss'
})

export class DeploymentSecretsComponent implements OnInit {

  secretForm!: FormGroup;
  showSecretForm: boolean = false;
  storedEnvironment: any;
  deploymentdetails: any;
  deploymentId: string = '';

  secretList: any = [];
  @Input() deploymentData: any;
  @Input() canAddVariables: boolean = false;
  @Input({ required: false }) secretDataFromParent: any;
  @Output() secretDetails = new EventEmitter<any>();

  @ViewChild('rawEditorModel') private rawEditorModel!: ModalComponent;
  deploymentResourceExhausted: boolean = false;

  public modalConfig: any = {
    modalTitle: 'Raw Editor',
    width: '780px',
    height: 'auto',
    hideDismissButton: () => false,
    hideCloseButton: () => true
  };

  showPasswordSet = new Set<number>();
  editIndex: number | null = null;
  isEditSecret: boolean = false;
  @Input() currentStatus: string = '';
  freezeAddNewData: boolean = false;

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
      (res: any) => res.resource_type === 'secrets'
    );
    this.deploymentResourceExhausted = deploymentResource?.remaining === 0;

    this.secretForm = this.fb.group({
      rules: this.fb.array([]),
    });
    // this.sharedService.deploymentData$.subscribe(data => {
    //   console.log('Data from super parent:', data);
    //   this.deploymentdetails = data;
    // });
    this.ac.queryParams.subscribe(params => {
      const deploymentId = params['id'];
      this.deploymentId = deploymentId;

      if (deploymentId) {
        this.isEditSecret = true;
        this.deploymentsService.getDeploymentById(deploymentId).subscribe((res: any) => {
          this.deploymentdetails = this.deploymentData || res.data;

          this.handleSecretListLoading();
        });
      } else {
        // If there's no deploymentId but we still want to process secrets (maybe with deploymentData)
        if (this.deploymentData) {
          this.isEditSecret = false;
          this.deploymentdetails = this.deploymentData;
          this.handleSecretListLoading();
        }
      }
    });

  }

  get rulesFormArray(): FormArray {
    return this.secretForm.get('rules') as FormArray;
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

  addNewSecretForm(): void {
    this.showSecretForm = !this.showSecretForm;
    if (this.showSecretForm) {
      this.rulesFormArray.clear();
      this.addRule();
    }
  }

  addSecret() {
    this.showSecretForm = false;

    if (this.secretForm.valid) {
      const rules = this.secretForm.value.rules;
      if (this.editIndex && this.editIndex >= 0) {
        const updatedSecret = {
          EnvVariable: rules[0].name,
          Value: rules[0].value
        };

        this.secretList[this.editIndex] = updatedSecret;
        this.editIndex = null;
      } else {
        const newSecrets = rules.map((rule: any) => ({
          EnvVariable: rule.name,
          Value: rule.value
        }));

        this.secretList = [...this.secretList, ...newSecrets];
      }

      const uniqueMap = new Map<string, any>();
      this.secretList.forEach((item: any) => {
        uniqueMap.set(item.EnvVariable, item);
      });
      this.secretList = Array.from(uniqueMap.values());
      this.secretDetails.emit({ data: this.secretList });


      this.addEnvVariables(this.secretList);
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
    this.secretList = updated;
    this.addSecret();
  }
  addEnvVariables(data: any) {
    const req = {
      secret: data.reduce((acc: any, item: any) => {
        acc[item.EnvVariable] = item.Value;
        return acc;
      }, {} as { [key: string]: string }),

    }

    if (this.deploymentId) {
      this.deploymentsService.updateDeployment(this.deploymentId, req).subscribe({
        next: (res: any) => {
          console.log(res);
          // this.secretList = [...envVariables];
        },
        error: (err) => {
          this.toaster.error(err);
        }
      });
    }
  }
  togglePassword(index: number): void {
    if (this.showPasswordSet.has(index)) {
      this.showPasswordSet.delete(index);
    } else {
      this.showPasswordSet.add(index);
    }
  }

  isPasswordVisible(index: number): boolean {
    return this.showPasswordSet.has(index);
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

    if (name && !value) {
      return { valueRequired: true };
    }

    return null;
  }

  editSecret(index: number): void {
    const secret = this.secretList[index];

    this.showSecretForm = true;
    this.editIndex = index;

    this.rulesFormArray.clear();
    this.rulesFormArray.push(this.fb.group({
      name: [secret.EnvVariable, [Validators.required, Validators.pattern('^[A-Za-z0-9_-]+$')]],
      value: [secret.Value, Validators.required]
    }));
  }
  deleteSecret(index: number) {
    const secret = this.secretList[index];
    this.editIndex = index;
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Secret';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          this.secretList.splice(index, 1);
          this.editIndex = -1;

          const req = {
            secret: this.secretList.reduce((acc: any, item: any) => {
              acc[item.EnvVariable] = item.Value;
              return acc;
            }, {} as { [key: string]: string }),
          }
          if (this.deploymentId) {
            this.deploymentsService.updateDeployment(this.deploymentId, req).subscribe({
              next: (res: any) => {
                console.log(res);
                this.secretList = this.mapEnvVariables(res.data.secret || {});
              },
              error: (err) => {
                this.toaster.error(err);
              }
            });
          }
        }
      });
  }

  private handleSecretListLoading(): void {
    if (!this.deploymentdetails?.name) return;

    // if (this.storedEnvironment && this.canAddVariables) {
    //   this.deploymentsService.getSecreteList(this.storedEnvironment.id, this.deploymentdetails.name).subscribe((res: any) => {
    //     const envVariables = this.mapEnvVariables(res?.data?.data || {});
    //     this.secretList = [...this.secretList, ...envVariables];
    //   });
    // }

    if (!this.canAddVariables && this.secretDataFromParent?.data) {
      // const newVariables = this.mapEnvVariables(this.secretDataFromParent.data);
      this.secretList = this.secretDataFromParent.data;
    }
  }
}
