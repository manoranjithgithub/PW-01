import { Routes } from '@angular/router';
export const routes: Routes = [

  {
    path: '',
    loadComponent: () => import('./projects.component').then(m => m.ProjectsComponent),

  },
  {
    path: 'project-preferences',
    loadComponent: () => import('./project-preference/project-preference.component').then(m => m.ProjectPreferenceComponent),
  },
  {
    path: 'create-project',
    loadComponent: () => import('./create-project/create-project.component').then(m => m.CreateProjectComponent),
  },
  {
    path: 'create-environment',
    loadComponent: () => import('./create-environment/create-environment.component').then(m => m.CreateEnvironmentComponent),
  },
  {
    path: 'environment-preferences',
    loadComponent: () => import('./view-environment/view-environment.component').then(m => m.ViewEnvironmentComponent),
  },
];