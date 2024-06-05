import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time',
  standalone: true
})
export class TimePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    if (typeof value !== 'number') {
      return value;
    }
    const hours = Math.floor(value);
    const minutes = Math.round((value - Math.floor(value)) * 60);
    return `${hours}h ${minutes}m`;
  }

}
