import { Component, Input, OnInit } from '@angular/core';
import {
  CardBodyComponent, CardComponent, CardGroupComponent, AccordionButtonDirective,
  AccordionComponent, AccordionItemComponent, TemplateIdDirective,
  FormModule
} from '@coreui/angular';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DeploymentsService } from '../deployment.service';
import { SharedService } from '../../../shared/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-deployment-config-maps',
  standalone: true,
  imports: [CardBodyComponent, CardComponent, CardGroupComponent, AccordionButtonDirective,
    AccordionComponent, AccordionItemComponent, TemplateIdDirective, CommonModule, FormModule, ReactiveFormsModule],
  providers: [DeploymentsService],
  templateUrl: './deployment-config-maps.component.html',
  styleUrl: './deployment-config-maps.component.scss'
})
export class DeploymentConfigMapsComponent implements OnInit {
  isFilePath: boolean = false;
  fileUploadForm!: FormGroup;
  deploymentdetails: any;
  selectedFile: any;
  @Input() currentStatus: string = '';

  fileName: string | null = null;
  freezeAddNewData: boolean = false;

  constructor(private fb: FormBuilder, private sharedService: SharedService,
    private deploymentsService: DeploymentsService, private ac: ActivatedRoute, private toaster: ToastrService
  ) { }

  ngOnInit(): void {
    this.freezeAddNewData = this.currentStatus && this.currentStatus === 'Building' ? true : false;
    this.fileUploadForm = this.fb.group({
      fileInput: [''],
      filePath: [''],
      fileName: ['']
    });
    // this.sharedService.deploymentData$.subscribe(data => {
    //   console.log('Data from super parent:', data);
    //   this.deploymentdetails = data;

    // });

    this.ac.queryParams.subscribe(params => {
      const depolyementId = params['id'];
      if (depolyementId) {
        this.deploymentsService.getDeploymentById(depolyementId).subscribe((res: any) => {
          this.deploymentdetails = res.data;
          this.fileUploadForm.get('filePath')?.setValue(this.deploymentdetails?.config_file_path)
          this.fileUploadForm.get('fileName')?.setValue(this.deploymentdetails?.config_file_name)
        })
      }
    });
  }

  onFileSelect(event: Event): void {
    const fileInput = this.fileUploadForm.get('fileInput');
    const filePath = this.fileUploadForm.get('filePath');
    const allowedExtensions = ['json', 'yml', 'yaml'];
    fileInput?.setValidators([Validators.required, this.fileValidator(allowedExtensions)]);
    fileInput?.updateValueAndValidity();
    filePath?.setValidators([Validators.required]);
    filePath?.updateValueAndValidity();

    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    if (!file) return;
    this.selectedFile = file;
    if (file.size > 100_000_000) {
      this.toaster.error('File size too large.');
      // this.fileError = 'File size large';
      return;
    }
    this.fileName = file.name;
    this.fileUploadForm.get('fileName')?.setValue(file.name);
    // this.fileError = '';
  }

  updateConfigFile() {
    const filePathControl = this.fileUploadForm.get('filePath')?.value;
    const fileInputControl = this.fileUploadForm.get('fileInput')?.value;
    const fileName = fileInputControl.split("\\").pop();
    const formData = new FormData();
    if (filePathControl && fileName && this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile?.name);
      formData.append('filePath', filePathControl);
      formData.append('name', this.deploymentdetails?.name);
      formData.append('stageToExecute', 'deploy');
    }
    console.log(this.deploymentdetails)
    this.deploymentsService.uploadConfigFile(this.deploymentdetails?.environment_id, formData).subscribe(res => {
      console.log(res)
    })
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
    this.selectedFile = null;
    this.fileUploadForm.get('fileInput')?.reset();
    this.fileUploadForm.get('fileName')?.reset();
    this.fileName = null;
    const fileInputElement = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInputElement) {
      fileInputElement.value = '';
    }
  }

}
