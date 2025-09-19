import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'utcToLocal',
  standalone: true
})
export class UtcToLocalPipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(value: string | Date | null | undefined, format: string = 'dd/MM/yyyy'): string {
    if (!value) return '';
    const date = new Date(value);
    return this.datePipe.transform(date, format) ?? '';
  }
}
