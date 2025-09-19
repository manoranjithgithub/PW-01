import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  CardBodyComponent, CardComponent, CardGroupComponent, NavComponent, NavItemComponent, NavLinkDirective, TabContentRefDirective, TabContentComponent, RoundedDirective, TabPaneComponent,
  FormControlDirective, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
} from '@coreui/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedService } from '../../../shared/services/shared.service';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-service-quota',
  standalone: true,
  imports: [CardGroupComponent, CardComponent, CardBodyComponent, NavComponent, NavItemComponent, NavLinkDirective,
    TabContentRefDirective, TabContentComponent, TabPaneComponent, FormControlDirective,
    FormCheckInputDirective, FormCheckLabelDirective, FormDirective, FormCheckComponent, ReactiveFormsModule, FormsModule
  ],
  providers: [SettingsService],
  templateUrl: './service-quota.component.html',
  styleUrl: './service-quota.component.scss'
})
export class ServiceQuotaComponent implements OnInit, OnDestroy {
  serviceQuotaForm!: FormGroup;
  envId: string = '';
  private subscription: Subscription = new Subscription();

  constructor(private http: SettingsService, private shared: SharedService, private fb: FormBuilder) {
   // const storedValue = this.shared.getCookie('environment');
   const storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.envId = JSON.parse(storedValue).id;
    }
    this.initializeForm();
    this.getServiceQuota(this.envId);
  }

  initializeForm(): void {
    this.serviceQuotaForm = this.fb.group({
      deployments: this.fb.group({
        current_count: [''],
        max_count: ['']
      }),
      secrets: this.fb.group({
        current_count: [''],
        max_count: ['']
      }),
      configMaps: this.fb.group({
        current_count: [''],
        maxCount: ['']
      }),
      endpoints: this.fb.group({
        current_count: [''],
        max_count: ['']
      })
    });
  }

  ngOnInit(): void {
    this.subscription = this.shared.envValueChange$.subscribe((value: any) => {
      this.envId = value.id;
      this.getServiceQuota(this.envId);
    });
  }

  getServiceQuota(env: string) {
    this.http.getServiceQuota(env).subscribe(
      (res: any) => {

        this.serviceQuotaForm.get('deployments')?.setValue(res.data.deployments);
        this.serviceQuotaForm.get('secrets')?.setValue(res.data.secrets);
        this.serviceQuotaForm.get('configMaps')?.setValue(res.data.configMaps);
        this.serviceQuotaForm.get('endpoints')?.setValue(res.data.endpoints);
      },
      error => {
        console.error('Error:', error);
      });
  }

  updateDeploymentsSlider(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.serviceQuotaForm.get('deployments.current_count')?.patchValue(Number(value));
  }

  updateSecretsSlider(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.serviceQuotaForm.get('secrets.current_count')?.patchValue(Number(value));
  }

  updateConfigmapsSlider(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.serviceQuotaForm.get('configMaps.current_count')?.patchValue(Number(value));
  }

  updateEndpointsSlider(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.serviceQuotaForm.get('endpoints.current_count')?.patchValue(Number(value));
  }

  onSubmit() {
    console.log(this.serviceQuotaForm.value);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
