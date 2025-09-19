import { CommonModule } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.component.html',
  styleUrl: './summary-card.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SummaryCardComponent {
  @Input() value: string | number = '';
  @Input() label: string = '';
  @Input() change: number = 0;
  @Input() description: string = 'from last 7 days';
}
