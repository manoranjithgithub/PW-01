import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./llm.component').then((m) => m.LLMComponent)
  },
  {
    path: 'create-model/configure',
    loadComponent: () => import('./configure-model/configure-model.component').then((m) => m.ConfigureModelComponent)
  },
  {
    path: 'view-model',
    loadComponent: () => import('./view-model/view-model.component').then((m) => m.ViewModelComponent)
  },
  {
    path: 'create-model',
    loadComponent: () => import('./create-model/create-model.component').then((m) => m.CreateModelComponent)
  }
];
