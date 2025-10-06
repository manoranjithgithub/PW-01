import { CommonModule } from '@angular/common';
import { Component, Input, AfterViewInit, ElementRef, ViewChild, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { TooltipDirective } from '@coreui/angular';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-utilization-chart',
  standalone: true,
  templateUrl: './utilization-chart.component.html',
  styleUrl: './utilization-chart.component.scss',
  imports: [CommonModule, TooltipDirective],
  encapsulation: ViewEncapsulation.None
})
export class UtilizationChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() value = 0;
  @Input() rawValue = '';

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart!: Chart;

  thresholds = {
    low: 50,
    moderate: 80,
    max: 100
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['rawValue']) {
      this.renderGauge();
    }
  }

  ngAfterViewInit(): void {
    this.renderGauge();
  }
  renderGauge(): void {
    const canvas = this.chartCanvas.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const value = Math.min(this.value ?? 0, 100);
    let fillColor = '#15BB0D';
    if (value > 80) {
      fillColor = '#8E2300';
    } else if (value > 50) {
      fillColor = '#E36E00';
    }

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#99D10B');
    gradient.addColorStop(1, '#B31616');

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [value, 100 - value],
          backgroundColor: [fillColor, gradient],
          borderWidth: 0,
          hoverBackgroundColor: [fillColor, gradient],
        }]
      },
      options: {
        rotation: -90,
        circumference: 180,
        cutout: '80%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
          // tooltip: {
          //       enabled: true,
          //       callbacks: {
          //         label: function () {
          //           return 'usage for the past 5 minutes';
          //         },
          //         title: function () {
          //           return '';
          //         }
          //       }
          // },
        }
      }
    });
  }

  getValueColor(value: number): string {
    if (value <= 50) return '#367E00';
    if (value <= 80) return '#E36E00';
    return '#BD2913';
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
