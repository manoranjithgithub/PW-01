import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  transform(value: string, searchText: string): string {
    if (!searchText || !value) return value;
    const regex = new RegExp(`(${searchText})`, 'gi');
    return value.replace(regex, `<span class="highlight">$1</span>`);
  }
}
