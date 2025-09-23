import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import {
  ContainerComponent, ShadowOnScrollDirective, InputGroupComponent, InputGroupTextDirective,
  FormControlDirective, CardGroupComponent, CardComponent, CardBodyComponent, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
} from '@coreui/angular';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
import { Subscription } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { DefaultHeaderComponent } from '../../../shared/components/layout';
import { SecretsService } from '../secrets.service';


interface DataFormGroup {
  key: FormControl<string | null>;
  value: FormControl<any>;
}

type DataFormArray = FormArray<FormGroup<DataFormGroup>>;

@Component({
  selector: 'app-create-secret',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterOutlet,
    DefaultHeaderComponent, ContainerComponent, ShadowOnScrollDirective, InputGroupComponent,
    InputGroupTextDirective, FormControlDirective, CardGroupComponent, CardComponent, FormCheckInputDirective,
    FormCheckLabelDirective, CardBodyComponent, FormDirective, FormCheckComponent, ConfirmationModalComponent, LoaderComponent],
  templateUrl: './create-secret.component.html',
  styleUrls: ['./create-secret.component.scss'],
  providers: [SecretsService]
})
export class CreateSecretComponent implements OnInit, OnDestroy {
  secretForm!: FormGroup;
  formId: string = '';
  envId: any;
  isView: boolean = false;
  hide = true;
  private subscription: Subscription = new Subscription();

  constructor(private activatedRoute: ActivatedRoute, private fb: FormBuilder, private router: Router,
    private toaster: ToastrService, private http: SecretsService, private sharedService: SharedService,
    private modalService: NgbModal

  ) {
    this.initializeForm();
    this.activatedRoute.queryParams.subscribe(params => {
      this.formId = params['id'];
      if (params['id']) {
        this.isView = true;
        this.secretForm.disable();
      }

    });
    this.envId = JSON.parse(`${localStorage.getItem('environment')}`).id;
    // this.envId = JSON.parse(`${this.sharedService.getCookie('environment')}`).id;
  }
  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.router.navigate(['/secrets']);
    });
    if (this.formId) {
      this.http.getSecretByName(this.envId, this.formId).subscribe((res: any) => {
        console.log(res.data)
        this.populateForm(res.data);
        if (this.isView) {
          const dataArray = this.secretForm.get('data') as FormArray;
          dataArray.controls.forEach(group => {
            (group as FormGroup).disable();
          });
        }

      })
    }
  }

  initializeForm(): void {
    this.secretForm = this.fb.group({
      name: ['', Validators.required],
      data: this.fb.array([this.createDataGroup()])
    });


  }
  get data(): FormArray {
    return this.secretForm.get('data') as FormArray;
  }

  createDataGroup(): FormGroup {
    return this.fb.group({
      key: [''],
      value: ['']
    });
  }

  addData(): void {
    this.data.push(this.createDataGroup());
  }

  removeData(index: number): void {
    const dataFormArray = this.data;
    if (dataFormArray.length > 1) {
      dataFormArray.removeAt(index);
    } else {
      this.toaster.warning('Cannot remove the last item.');
    }
  }


  onSubmit(): void {
    if (!this.secretForm.valid) {
      return
    }
    const formValue = this.secretForm.value;
    const transformedData = this.transformData(formValue.data);

    const req = {
      name: formValue.name,
      data: transformedData
    };
    if (this.formId) {
      this.http.updateSecret(this.envId, this.formId, req).subscribe((res: any) => {
        if (res.success) {
          this.toaster.success('Updated Successfully');
          this.router.navigate(['/secrets']);
          console.log(res);
        } else {
          this.toaster.error(res.message);
        }
      })
    } else {
      this.http.createSecret(this.envId, req).subscribe((res: any) => {
        if (res.success) {
          this.toaster.success('Created Successfully');
          this.router.navigate(['/secrets'])
          console.log(res);
        } else {
          this.toaster.error(res.message);
        }
      })
    }
  }

  goToBack(): void {
    //this.router.navigate(['/secrets']);
    window.history.back();
  }
  private transformData(dataArray: any[]): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    dataArray.forEach(item => {
      if (item.key && item.value) {
        result[item.key] = item.value;
      }
    });
    return result;
  }

  populateForm(response: any) {
    const name = response.name;
    const data = response.data;

    const dataArray = this.secretForm.get('data') as DataFormArray;
    dataArray.clear();

    this.secretForm.patchValue({
      name: name
    });

    Object.keys(data).forEach(key => {
      const formGroup = this.fb.group({
        key: [key],
        value: [data[key]]
      }) as FormGroup<DataFormGroup>;

      dataArray.push(formGroup);
    })
  }

  toggleVisibility(): void {
    this.hide = !this.hide;
  }
  enableForm() {
    this.isView = false;
    this.secretForm.enable();
  }
  openConfirmationDialog() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'Secret';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          console.log('Confirmed delete!');
          this.http.deleteSecret(this.envId, this.formId).subscribe((res: any) => {
            if (res.success) {
              this.toaster.success('Deleted Successfully');
              this.router.navigate(['/secrets'])
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
