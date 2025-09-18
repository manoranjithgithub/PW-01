import { Component } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loader',
    standalone:true,
    imports: [CommonModule],
    templateUrl: './loader.component.html',
    styleUrl: './loader.component.scss'
})
export class LoaderComponent {
  isLoading$: any;

  constructor(private loaderService: SharedService) {
    this.isLoading$ = this.loaderService.isLoading$;
  }
}
