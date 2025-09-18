import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'maskPassword',standalone: true })
export class MaskPasswordPipe implements PipeTransform {
  transform(value: string, maskChar: string = '*'): string {
    return maskChar.repeat(value?.length || 0);
  }
}
