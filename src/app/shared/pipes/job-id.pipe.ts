import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jobId',
  standalone: true,
})
export class JobIdPipe implements PipeTransform {
  transform(id: number | string): string {
    const num = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(num)) return `HRF-#0000`;
    return `HRF-#${String(num).padStart(4, '0')}`;
  }
}
