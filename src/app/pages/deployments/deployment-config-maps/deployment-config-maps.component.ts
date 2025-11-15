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
import * as yaml from 'js-yaml';

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
  parsedConfigData: any;

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
    const req ={
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
