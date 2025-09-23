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
import { ConfigurationService } from '../configurations.service';

interface DataFormGroup {
  key: FormControl<string | null>;
  value: FormControl<any>;
}

type DataFormArray = FormArray<FormGroup<DataFormGroup>>;

@Component({
  selector: 'app-create-config',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterOutlet,
    DefaultHeaderComponent, ContainerComponent, ShadowOnScrollDirective, InputGroupComponent,
    InputGroupTextDirective, FormControlDirective, CardGroupComponent, CardComponent, FormCheckInputDirective,
    FormCheckLabelDirective, CardBodyComponent, FormDirective, FormCheckComponent, ConfirmationModalComponent, LoaderComponent],
  templateUrl: './create-config.component.html',
  styleUrl: './create-config.component.scss',
  providers: [ConfigurationService]
})
export class CreateConfigComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  formId: string = '';
  env: any;
  isView: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(private activatedRoute: ActivatedRoute, private fb: FormBuilder, private router: Router,
    private toaster: ToastrService, private http: ConfigurationService, private sharedService: SharedService,
    private modalService: NgbModal
  ) {
    this.initializeForm();
    this.activatedRoute.queryParams.subscribe(params => {
      this.formId = params['id'];
      if (params['id']) {
        this.isView = true;
        this.form.disable();
      }
    });
    // const storedValue = this.sharedService.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue) {
      this.env = JSON.parse(storedValue).id;
    }
  }
  ngOnInit(): void {
    this.subscription = this.sharedService.envValueChange$.subscribe(value => {
      this.router.navigate(['/configs']);
    });
    if (this.formId) {
      this.http.getConfigByName(this.env, this.formId).subscribe((res: any) => {
        this.populateForm(res.data);
        if (this.isView) {
          const dataArray = this.form.get('data') as FormArray;
          dataArray.controls.forEach(group => {
            (group as FormGroup).disable();
          });
        }

      })
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      data: this.fb.array([this.createDataGroup()])
    });


  }
  get data(): FormArray {
    return this.form.get('data') as FormArray;
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
    if (!this.form.valid) {
      this.toaster.error('Fill the missing fields');
      return
    }
    const formValue = this.form.value;
    const transformedData = this.transformData(formValue.data);

    const req = {
      name: formValue.name,
      data: transformedData
    };
    if (this.formId) {
      this.http.updateConfig(this.env, this.formId, req).subscribe((res: any) => {
        if (res.success) {
          this.toaster.success('Updated Successfully');
          this.router.navigate(['/configs'])
        } else {
          this.toaster.error(res.message);
        }
      })
    } else {
      this.http.createConfig(this.env, req).subscribe((res: any) => {
        if (res.success) {
          this.toaster.success('Created Successfully');
          this.router.navigate(['/configs'])

        } else {
          this.toaster.error(res.message);
        }
      })
    }
  }

  goToBack(): void {
    //this.router.navigate(['/configs']);
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

    const dataArray = this.form.get('data') as DataFormArray;
    dataArray.clear();

    this.form.patchValue({
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
  enableForm() {
    this.form.enable();
    this.isView = false;
  }

  getClass(item: any) {
    return {
      'bi-eye': !item.visible,
      'bi-eye-slash': item.visible
    };
  }

  getInputType(item: any): string {
    return item.visible ? 'text' : 'password';
  }

  toggleVisibility(item: any): void {
    item.visible = !item.visible;
  }

  openConfirmationDialog() {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
     modalRef.componentInstance.selectedItem = 'environment variable';
    modalRef.componentInstance.message = 'Are you sure you want to proceed?';

    modalRef.result.then(
      (result) => {
        if (result) {
          console.log('Confirmed delete!');
          this.http.deleteConfigs(this.env, this.formId).subscribe((res: any) => {
            if (res.success) {
              this.toaster.success('Deleted Successfully');
              this.router.navigate(['/configs'])
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
