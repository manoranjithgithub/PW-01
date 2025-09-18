import { Routes } from '@angular/router';
import { DeploymentDetailsComponent } from './deployment-details.component';

export const routes: Routes = [
  {
    path: '',
    component: DeploymentDetailsComponent,
    // data: { breadcrumb: 'Deployment Details' }
    // data: { breadcrumb: 'details' }
    // data: {
    //   title: $localize`Deployment Details`
    // }
  }
];

