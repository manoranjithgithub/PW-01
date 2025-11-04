import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { AccordionButtonDirective, AccordionComponent, AccordionItemComponent, AlertComponent, CalloutComponent, CardBodyComponent, CardComponent, CardGroupComponent, ContainerComponent, DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, FormControlDirective, FormDirective, ModalComponent, NavComponent, NavItemComponent, NavLinkDirective, ShadowOnScrollDirective, TabContentComponent, TabContentRefDirective, TabPaneComponent, TemplateIdDirective, TooltipDirective } from '@coreui/angular';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AgGridTableComponent } from './components/ag-grid-table/ag-grid-table.component';
import { DefaultHeaderComponent } from './components/layout';
import { LoaderComponent } from './components/loader/loader.component';

export const SHARED_IMPORTS = [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    RouterOutlet,
    DefaultHeaderComponent,
    ContainerComponent,
    ShadowOnScrollDirective,
    AgGridTableComponent,
    AgGridModule,
    MatIconModule,
    LoaderComponent,
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    FormControlDirective,
    ModalComponent,
    AlertComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    FormDirective,
    FormCheckComponent,
    CardGroupComponent, CardComponent, CardBodyComponent,
    NavComponent, NavItemComponent, NavLinkDirective,
    TabContentRefDirective, TabContentComponent, TabPaneComponent,
    DropdownComponent, DropdownItemDirective, DropdownMenuDirective,
    DropdownToggleDirective, AccordionButtonDirective, AccordionComponent, AccordionItemComponent,
    TemplateIdDirective, CalloutComponent,
    TooltipDirective
];
