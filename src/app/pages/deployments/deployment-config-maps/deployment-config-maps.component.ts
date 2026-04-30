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
  @Input() deploymentdetails: any;
  @Input() currentStatus: string = '';
  @Input() forceDisable: boolean = false;

  fileName: string | null = null;
  freezeAddNewData: boolean = false;
  isBuilding: boolean = false;
  parsedConfigData: any;
  selectedFileName = '';
  base64Snippet = '';
  selectedFileSize: number = 0;
  selectedFileTime: Date = new Date();

  isSubmitButtonDisabled: boolean = false;

  constructor(private fb: FormBuilder,
    private deploymentsService: DeploymentsService, private ac: ActivatedRoute, private toaster: ToastrService,
    public permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.freezeAddNewData = this.forceDisable || (this.currentStatus && this.currentStatus === 'Building' ? true : false);
    this.isBuilding = this.currentStatus && this.currentStatus === 'Building' ? true : false;
    
    this.fileUploadForm = this.fb.group({
      fileInput: [''],
      filePath: ['', [Validators.required, Validators.maxLength(40)]],
      fileName: ['', [Validators.required, Validators.maxLength(40)]]
    });

    const shouldDisableForm = this.freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
    if (shouldDisableForm) {
      this.fileUploadForm.disable();
    } else {
      this.fileUploadForm.enable();
    }

    this.fileUploadForm.statusChanges.subscribe(status => {
      this.isSubmitButtonDisabled = status !== 'VALID';
    });

    this.ac.queryParams.subscribe(params => {
      const depolyementId = params['id'];
      if (depolyementId) {
        // Use deploymentdetails passed from parent
        this.isBuilding = this.currentStatus?.toLowerCase() === 'building' ? true : false;
        const isStopped = this.deploymentdetails?.status?.toLowerCase() === 'stopped';
        const freezeAddNewData = this.forceDisable || isStopped || this.currentStatus?.toLowerCase() === 'building' ? true : false;
        const shouldDisable = freezeAddNewData || !(this.permissionService.canWriteGlobal() || this.permissionService.canAdminGlobal() || this.permissionService.canDeleteForCurrentUser(null, null));
        if (shouldDisable) {
          this.fileUploadForm.disable();
        } else {
          this.fileUploadForm.enable();
        }

        const configPath = this.deploymentdetails?.config?.path || '';
        const configName = this.deploymentdetails?.config?.name || '';

        this.fileUploadForm.get('filePath')?.setValue(configPath);
        this.fileUploadForm.get('fileName')?.setValue(configName);

        if (!configPath && !configName) {
          this.fileUploadForm.get('filePath')?.clearValidators();
          this.fileUploadForm.get('fileName')?.clearValidators();
        }

        this.fileUploadForm.updateValueAndValidity();

        this.selectedFileName = configName;
        this.base64Snippet = this.deploymentdetails?.config?.data ? this.deploymentdetails?.config?.data.substring(0, 60) + '...' : '';
      }
    });
  }

  onFileSelect(event: Event): void {
    const filePath = this.fileUploadForm.get('filePath');
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.selectedFileName = file.name;
    this.selectedFileSize = file.size;
    this.selectedFileTime = new Date();
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const base64String = fileReader.result as string;
      const pureBase64 = base64String.split(',')[1];
      this.base64Snippet = pureBase64.substring(0, 60) + '...';
      const base64Length = pureBase64.length;
      const padding = (pureBase64.match(/=+$/) || [''])[0].length;
      const fileSizeInBytes = (base64Length * 3) / 4 - padding;
      const MAX_FILE_SIZE = 100 * 1024; // 100KB

      if (fileSizeInBytes > MAX_FILE_SIZE) {
        this.fileUploadForm.get('fileInput')?.setErrors({ fileSizeExceeded: true });
        this.fileUploadForm.markAllAsTouched();
        this.parsedConfigData = null;
        return;
      }
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
            // this.fileUploadForm.get('fileName')
            this.toaster.success('Config Map updated successfully');
            // this.clearFile();
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

  getFileType(fileName: string | undefined): string {
    if (!fileName) return '';
    const extension = fileName.split('.').pop()?.toUpperCase() || '';
    return extension;
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 10) / 10 + ' ' + sizes[i];
  }

  getFileTimeAgo(uploadDate: Date | undefined): string {
    if (!uploadDate) return '';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - uploadDate.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  clearFile() {
    this.fileUploadForm.get('fileInput')?.reset();
    this.fileUploadForm.get('fileName')?.reset();
    this.fileUploadForm.get('filePath')?.reset();
    this.fileName = null;
    const fileInputElement = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInputElement) {
      fileInputElement.value = '';
    }
    this.selectedFileName = '';
    this.parsedConfigData = null;
    this.base64Snippet = '';
    this.selectedFileSize = 0;
    this.selectedFileTime = new Date();
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
            this.toaster.success('File deleted successfully');
          }
        },
        error: (err) => {
          this.toaster.error(err);
        }
      });
    }
  }
}
