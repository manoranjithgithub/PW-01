import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Port, ServiceObject } from '../../../core/models/list-item.model';
import {
  ContainerComponent, ShadowOnScrollDirective, InputGroupComponent, InputGroupTextDirective,
  FormControlDirective, CardGroupComponent, CardComponent, CardBodyComponent, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
} from '@coreui/angular';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DefaultHeaderComponent } from '../../../shared/components/layout';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { SharedService } from '../../../shared/services/shared.service';
import { EndpointsService } from '../endpoints.service';

@Component({
    selector: 'app-create-endpoints',
    standalone:true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterOutlet,
        DefaultHeaderComponent, ContainerComponent, ShadowOnScrollDirective, InputGroupComponent,
        InputGroupTextDirective, FormControlDirective, CardGroupComponent, CardComponent, FormCheckInputDirective,
        FormCheckLabelDirective, CardBodyComponent, FormsModule, FormDirective, FormCheckComponent, ModalComponent,
        ConfirmationModalComponent, LoaderComponent],
    templateUrl: './create-endpoints.component.html',
    styleUrls: ['./create-endpoints.component.scss'],
    providers: [EndpointsService]
})
export class CreateEndpointsComponent implements OnInit, OnDestroy {
  endpointForm!: FormGroup;
  envId = '';
  serviceOptions: ServiceObject[] = [];
  availablePorts: Port[][] = [];
  isHostDisabled = true;
  hide = true;
  envDetails:any = {};
  @Input() showButton: boolean = true;
  
  private subscription: Subscription = new Subscription();

  @ViewChild('confirmationModel') private confirmationModel!: ModalComponent;

  public confirmationConfig: any = {
    modalTitle: '',
    width: '500px',
    hideDismissButton: () => true,
    hideCloseButton: () => true,
  };

  submitted = false;
  showAuthentication = false;
  domainValue = '3.15.124.155';
  formId: string = '';
  isView: boolean = false;
  pathTypes = [{
    name: 'Prefix',
    value: 'Prefix'
  }, {
    name: 'Exact',
    value: 'Exact'
  }, {
    name: 'Implementation Specific',
    value: 'ImplementationSpecific'
  }
  ]

  constructor(private router: Router, private fb: FormBuilder,
    private http: EndpointsService, private activatedRoute: ActivatedRoute,
    private toaster: ToastrService, private sharedService: SharedService, 
    private modalService:NgbModal) {
    this.initializeForm();
    this.activatedRoute.queryParams.subscribe(params => {
      this.formId = params['id'];
    });
   // this.envId = JSON.parse(`${this.sharedService.getCookie('environment')}`).id;
   this.envId = JSON.parse(`${localStorage.getItem('environment')}`).id;
  }

  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.router.navigate(['/endpoints']);
   });
    this.http.getServiceList(this.envId).subscribe((service: any) => {
      this.serviceOptions = service.data;
    });
    this.setupSubscriptions();
  }

  initializeForm(): void {
    this.endpointForm = this.fb.group({
      name: ['', Validators.required],
      customDns:[false],
      host: [{ value: '', disabled: true }, Validators.required],
      rules: this.fb.array([this.createRule()]),
      showAuthentication: [false],
      authentication: this.fb.group({
        username: [''],
        password: ['']
      })
    });
  }

  goToEndpoints() {
    //this.router.navigate(['/endpoints']);
    window.history.back();
  }

  createRule(): FormGroup {
    return this.fb.group({
      path: ['/', Validators.required],
      path_type: ['Prefix', Validators.required],
      service: [''],
      service_port: ['']
    });
  }

  addRule(): void {
    (this.endpointForm.get('rules') as FormArray).push(this.createRule());
  }

  removeRule(index: number): void {
    this.rules.removeAt(index);
  }

  get rules(): FormArray {
    return this.endpointForm.get('rules') as FormArray;
  }

  get authentication(): FormGroup {
    return this.endpointForm.get('authentication') as FormGroup;
  }

  isInvalid(controlName: string): boolean {
    const control = this.endpointForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  isArrayInvalid(index: number, controlName: string): boolean {
    const control = this.rules.at(index).get(controlName);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  setupSubscriptions(): void {
    if (this.formId) {
      this.http.getEndPointsById(this.envId, this.formId).subscribe((res: any) => {
        if (res.data) {
          const rulesArray = this.endpointForm.get('rules') as FormArray;
          rulesArray.clear();
          res.data.rules.forEach((rule: any) => {
            rulesArray.push(this.createRule());
          });
          this.endpointForm.patchValue(res.data);
          const authControls = this.authentication.controls;
          const showAuth = authControls['username'].value || authControls['password'].value;
          this.endpointForm.patchValue({ showAuthentication: showAuth ? true : false });
          this.updateAvailablePorts(res.data.rules || []);
        }
        this.toggleForm(this.endpointForm, true)

      });
    }else{
      this.http.getEnvironmentById(this.envId).subscribe((res: any) => {
        this.envDetails = res.Response;
        this.endpointForm.get('name')?.valueChanges.subscribe(name => {
          this.updateHostField(name);
        });
        this.updateHostField(this.endpointForm.get('name')?.value);
      });
    }
  }

  private updateHostField(name: string): void {
    let ingressDomain;
    if(this.envDetails?.ingressDomain != null)
      ingressDomain  =  this.extractDomain(this.envDetails?.ingressDomain);
    else
      ingressDomain = '';
    const updatedHost = `${name}.${ingressDomain}`;
    this.endpointForm.get('host')?.setValue(updatedHost, { emitEvent: false });
  }

  private extractDomain(url: string): string {
    const parts = url.split('.');
    return parts.slice(1).join('.');
  }

  private updateAvailablePorts(rules: any[]): void {
    rules.forEach((rule, index) => {
      const selectedService = this.serviceOptions.find(s => s.name === rule.service);
      if (selectedService) {
        this.availablePorts[index] = selectedService.ports;
        this.rules.at(index).patchValue({
          service_port: this.availablePorts[index].find(port => port.number === rule.service_port)?.number ||''
        });
      }
    });
  }

  onServiceChange(index: number): void {
    const selectedServiceId = this.rules.at(index).get('service')?.value;
    const selectedService = this.serviceOptions.find(s => s.name === selectedServiceId);

    if (selectedService) {
      this.availablePorts[index] = selectedService.ports;
      const defaultPort = this.availablePorts[index].length ? this.availablePorts[index][0].number : '';
      this.rules.at(index).patchValue({
        service_port: defaultPort
      });
    }
  }

  toggleHost(event: Event): void {
    this.isHostDisabled = !(event.target as HTMLInputElement).checked;
    const hostControl = this.endpointForm.get('host');
    if (this.isHostDisabled) {
      hostControl?.disable();
    } else {
      this.confirmationModel.open();
      hostControl?.enable();
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.endpointForm.invalid) return;

    const formValue = this.endpointForm.getRawValue();
    if (!formValue.showAuthentication) delete formValue.authentication;
    delete formValue.showAuthentication;

    if (this.formId) {
      this.http.updateEndPointsById(this.envId, this.formId, formValue).subscribe((res: any) => {
        if (res.success) {
          this.toaster.success('Updated Successfully');
          this.router.navigate(['/endpoints']);
        } else {
          this.toaster.error(res.message)
        }
      }, error => {
      });
    } else {
      this.http.createEndPoints(this.envId, formValue).subscribe((res: any) => {
        if (res.success) {
          this.toaster.success('Created Successfully');
          this.router.navigate(['/endpoints']);
        } else {
          this.toaster.error(res.message)
        }
      }, error => {
      });
    }

  }

  toggleAuthentication(event: Event): void {
    this.showAuthentication = (event.target as HTMLInputElement).checked;
    this.endpointForm.get('showAuthentication')?.setValue(this.showAuthentication);
    this.updateAuthenticationValidation();
  }

  private updateAuthenticationValidation(): void {
    const authGroup = this.authentication;

    if (this.showAuthentication) {
      authGroup.get('username')?.setValidators(Validators.required);
      authGroup.get('password')?.setValidators(Validators.required);
    } else {
      authGroup.get('username')?.clearValidators();
      authGroup.get('password')?.clearValidators();
    }
    authGroup.get('username')?.updateValueAndValidity();
    authGroup.get('password')?.updateValueAndValidity();
  }

  closeModal(): void {
    this.confirmationModel.close();
  }

  copyDomainValue(inputElement: HTMLInputElement): void {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
  }

  toggleForm(form: FormGroup, disable: boolean) {
    if (disable) {
      form.disable();
    } else {
      form.enable();
    }
    this.isView = disable;
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control instanceof FormArray) {
        control.controls.forEach(group => {
          if (disable) {
            group.disable();
          } else {
            group.enable();
          }
        });
      }
    });
    this.endpointForm.get('host')?.disable()
  }

  toggleVisibility(): void {
    this.hide = !this.hide;
  }

  openConfirmationDialog() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
     modalRef.componentInstance.selectedItem = 'Endpoint';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          console.log('Confirmed delete!');
          this.http.deleteEndPoints(this.envId, this.formId).subscribe((res: any) => {
            if (res.success) {
              this.toaster.success('Deleted Successfully');
              this.router.navigate(['/endpoints'])
            }
        })
        } else {
          console.log('Cancelled delete!');
        }
      });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
