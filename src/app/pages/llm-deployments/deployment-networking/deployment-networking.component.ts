import { Component, EventEmitter, Input, OnInit, Output,  ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, } from '@angular/forms';
import {
  FormCheckComponent,
} from '@coreui/angular';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { NgbModal, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { ActivatedRoute } from '@angular/router';
import { LLMDeploymentsService } from '../llm-deployment.service';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
@Component({
  selector: 'app-deployment-networking',
  standalone: true,
  imports: [
    FormCheckComponent,
    ConfirmationModalComponent,
    ModalComponent, NgbPopoverModule, SHARED_IMPORTS],
  templateUrl: './deployment-networking.component.html',
  styleUrl: './deployment-networking.component.scss',
  providers: [LLMDeploymentsService],
  encapsulation: ViewEncapsulation.None
})
export class DeploymentNetworkingComponent implements OnInit {

  @Output() closeModalEvent = new EventEmitter<void>();
  @Input() currentStatus: string = '';
  networkSettingsForm !: FormGroup;
  endpointStatus: string = '';
  ingressDomain: string = '';
  deploymentId: string = '';
  deploymentdetails: any;
  isPatchedValue: boolean = true;
  envId = '';

  constructor(private fb: FormBuilder, private deploymentService: LLMDeploymentsService,
    private modalService: NgbModal, private ac: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.envId = JSON.parse(`${localStorage.getItem('environment')}`).id || '';
    this.networkSettingsForm = this.fb.group({
      service: [''],
      host: [''],
    });

    this.ac.queryParams.subscribe(params => {
      const deploymentId = params['id'];
      this.deploymentId = deploymentId;
      this.deploymentService.getDeploymentById(deploymentId, this.envId).subscribe((res: any) => {
        this.deploymentdetails = res.data;
        this.networkSettingsForm.get('service')?.setValue(this.deploymentdetails?.name)
        this.getDeploymentById();
      })
    });

    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;

    this.networkSettingsForm.get('service')?.valueChanges.subscribe(value => {
      this.isPatchedValue = true;
      let envType = '';
      const region = 'ap-south-1a';

      if (environment) {
        const envObj = JSON.parse(environment);
        envType = envObj?.type || '';
      }
      const domainSuffix = envType === 'prod'
        ? `${envId}.${region}.lb.nimbuz.tech`
        : `${envId}.dev.${region}.lb.nimbuz.tech`;
      this.networkSettingsForm.get('host')?.setValue(`${value}-${domainSuffix}`);
      this.isPatchedValue = false
    });
  }

  getDeploymentById(): void {
    this.deploymentService.getDeploymentById(this.deploymentdetails?.name, this.envId).subscribe((res: any) => {
      if (res.status.toLowerCase() === "success") {
        this.ingressDomain = res.data?.network?.appIngressDomain;
      }
    });
  }

  deleteEndpoint() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Endpoint';
    modalRef.componentInstance.message = 'Are you sure you want to delete this endpoint?';

    modalRef.result.then(
      (result) => {
        if (result) {
          const environment = localStorage.getItem('environment');
          const envId = environment ? JSON.parse(environment).id : null;
        } else {
          console.log('Cancelled delete endpoint!');
        }
      });
  }

  closeModal() {
    this.closeModalEvent.emit();
  }
  copyDomain(domain: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(domain);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = domain;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

}
