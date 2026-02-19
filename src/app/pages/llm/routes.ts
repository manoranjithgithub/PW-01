import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./llm.component').then((m) => m.LLMComponent)
  }
];
