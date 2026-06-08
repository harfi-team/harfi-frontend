import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jobStatusClass',
  standalone: true,
})
export class JobStatusPipe implements PipeTransform {
  transform(status: string): string {
    const map: Record<string, string> = {
      'مفتوح': 'status-open',
      'open': 'status-open',
      'قيد التنفيذ': 'status-in-progress',
      'in-progress': 'status-in-progress',
      'in_progress': 'status-in-progress',
      'مكتمل': 'status-completed',
      'completed': 'status-completed',
      'مرفوض': 'status-rejected',
      'rejected': 'status-rejected',
      'ملغى': 'status-cancelled',
      'cancelled': 'status-cancelled',
      'متنازع عليه': 'status-disputed',
      'disputed': 'status-disputed',
    };
    return map[status] || '';
  }
}
