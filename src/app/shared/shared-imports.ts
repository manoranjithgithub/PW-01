import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import {
    AccordionButtonDirective, AccordionComponent, AccordionItemComponent, AlertComponent, ButtonDirective, CalloutComponent, CardBodyComponent, CardComponent, CardGroupComponent, CardHeaderComponent, ColComponent, ContainerComponent, DropdownComponent,
    DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, FormControlDirective, FormDirective, FormFeedbackComponent, FormLabelDirective, FormSelectDirective, InputGroupComponent, InputGroupTextDirective, ListGroupDirective, ListGroupItemDirective, ModalComponent, NavComponent, NavItemComponent, NavLinkDirective, RowComponent, ShadowOnScrollDirective, TabContentComponent, TabContentRefDirective, TabPaneComponent, TemplateIdDirective, TextColorDirective, TooltipDirective
} from '@coreui/angular';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AgGridTableComponent } from './components/ag-grid-table/ag-grid-table.component';
import { DefaultHeaderComponent } from './components/layout';
import { LoaderComponent } from './components/loader/loader.component';
import { DateRangePickerComponent } from './components/date-range-picker/date-range-picker.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

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
    DateRangePickerComponent,
    NgxDaterangepickerMd,
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonModule,
    MatButtonModule,
    MatSelectModule,
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
    TooltipDirective,
    RowComponent, ColComponent, TextColorDirective, CardHeaderComponent, FormLabelDirective, FormFeedbackComponent, InputGroupComponent, InputGroupTextDirective, FormSelectDirective, ButtonDirective, ListGroupDirective, ListGroupItemDirective
];
