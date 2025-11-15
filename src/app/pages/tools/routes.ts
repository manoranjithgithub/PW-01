import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tools.component').then(m => m.ToolsComponent),
  },
  {
    path: 'create-tool',
    loadComponent: () => import('./create-tool/create-tool.component').then(m => m.CreateToolComponent),

  },
  {
    path: 'view-tool',
    loadComponent: () => import('./view-tool/view-tool.component').then(m => m.ViewToolComponent),

  },
  {
    path: 'edit-tool',
    loadComponent: () => import('./edit-tool/edit-tool.component').then(m => m.EditToolComponent),
  },
];