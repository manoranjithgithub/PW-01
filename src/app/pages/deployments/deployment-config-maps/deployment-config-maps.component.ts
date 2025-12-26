import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { DeploymentsService } from '../deployment.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { PermissionService } from '../../../shared/services/permission.service';

@Component({
  selector: 'app-deployment-config-maps',
  standalone: true,
  imports: [SHARED_IMPORTS],
  providers: [DeploymentsService],
  templateUrl: './deployment-config-maps.component.html',
  styleUrl: './deployment-config-maps.component.scss'
})
export class DeploymentConfigMapsComponent implements OnInit {
  fileUploadForm!: FormGroup;
  deploymentdetails: any;
  @Input() currentStatus: string = '';

  fileName: string | null = null;
  freezeAddNewData: boolean = false;
  parsedConfigData: any;

  constructor(private fb: FormBuilder,
    private deploymentsService: DeploymentsService, private ac: ActivatedRoute, private toaster: ToastrService,
    public permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.freezeAddNewData = this.currentStatus && this.currentStatus === 'Building' ? true : false;
    this.fileUploadForm = this.fb.group({
      fileInput: [''],
      filePath: [''],
      fileName: ['']
    });

    const shouldDisableForm = this.freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
    if (shouldDisableForm) {
      this.fileUploadForm.disable();
    } else {
      this.fileUploadForm.enable();
    }

    this.ac.queryParams.subscribe(params => {
      const depolyementId = params['id'];
      if (depolyementId) {
        this.deploymentsService.getDeploymentById(depolyementId).subscribe((res: any) => {
          this.deploymentdetails = res.data;
          this.fileUploadForm.get('filePath')?.setValue(this.deploymentdetails?.config?.path)
          this.fileUploadForm.get('fileName')?.setValue(this.deploymentdetails?.config?.name)
        })
      }
    });
  }

  onFileSelect(event: Event): void {
    const filePath = this.fileUploadForm.get('filePath');
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const base64String = fileReader.result as string;
      const pureBase64 = base64String.split(',')[1];
      this.parsedConfigData = pureBase64;

    };
    filePath?.setValidators([Validators.required]);
    filePath?.updateValueAndValidity();

    fileReader.readAsDataURL(file);
  }

  updateConfigFile() {
    const req = {
      config: {
        path: this.fileUploadForm.get('filePath')?.value,
        name: this.fileUploadForm.get('fileName')?.value,
        data: this.parsedConfigData
      }
    }
    if (this.deploymentdetails.id) {
      this.deploymentsService.updateDeployment(this.deploymentdetails.id, req).subscribe({
        next: (res: any) => {
          if (res.status.toLowerCase() === 'success') {
            this.toaster.success('Config Map updated successfully');
            this.clearFile();
          }
        },
        error: (err) => {
          this.toaster.error(err);
        }
      });
    }
  }
  fileValidator(allowedExtensions: string[]) {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value;
      if (!file) {
        return null;
      }

      const extension = file.split('.').pop()?.toLowerCase();
      const isValidExtension = allowedExtensions.includes(extension!);

      if (!isValidExtension) {
        return { invalidFileType: true };
      }

      if (file.size > 100_000_000) {
        return { fileSizeExceeded: true };
      }

      return null;
    };
  }

  clearFile() {
    this.fileUploadForm.get('fileInput')?.reset();
    this.fileUploadForm.get('fileName')?.reset();
    this.fileName = null;
    const fileInputElement = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInputElement) {
      fileInputElement.value = '';
    }
  }
}
