import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  CardBodyComponent, CardComponent, CardGroupComponent, NavComponent, NavItemComponent, NavLinkDirective, TabContentRefDirective, TabContentComponent, RoundedDirective, TabPaneComponent,
  FormControlDirective, FormCheckInputDirective,
  FormCheckLabelDirective, FormDirective, FormCheckComponent
} from '@coreui/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, } from '@angular/forms';
import { NgForOf } from '@angular/common';
import { SharedService } from '../../../shared/services/shared.service';
import { ServiceObject } from '../../../core/models/list-item.model';
import { Subscription } from 'rxjs';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-observability-logging',
  standalone: true,
  imports: [CardGroupComponent, CardComponent, CardBodyComponent, NavComponent, NavItemComponent, NavLinkDirective,
    TabContentRefDirective, TabContentComponent, TabPaneComponent, FormControlDirective, NgForOf,
    FormCheckInputDirective, FormCheckLabelDirective, FormDirective, FormCheckComponent, ReactiveFormsModule,
  ],
  providers: [SettingsService],
  templateUrl: './observability-logging.component.html',
  styleUrl: './observability-logging.component.scss'
})
export class ObservabilityLoggingComponent implements OnInit, OnDestroy {
  observabilityLoggingForm!: FormGroup;
  envId: string = '';
  options: any = [];
  serviceOptions: ServiceObject[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private http: SettingsService, private shared: SharedService, private fb: FormBuilder) {
    // const storedValue = this.shared.getCookie('environment');
    const storedValue = localStorage.getItem('environment');
    if (storedValue && storedValue !== "undefined") {
      this.envId = JSON.parse(storedValue).id;
    }
    this.initializeForm();
    this.getServiceList(this.envId);
  }

  initializeForm(): void {
    this.observabilityLoggingForm = this.fb.group({
      forwardLogs: [''],
      loggingIndex: ['']
    });
  }

  ngOnInit(): void {
    this.subscription = this.shared.envValueChange$.subscribe((value: any) => {
      this.envId = value.id;
      this.getServiceList(this.envId);
    });
  }

  getServiceList(env: string) {
    // this.http.getServiceList(env).subscribe((service: any) => {
    //   this.serviceOptions = service.data;
    // });
  }

  onSubmit(): void {
    console.log(this.observabilityLoggingForm.value);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

}
