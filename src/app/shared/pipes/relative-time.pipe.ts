import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: false,
})
export class RelativeTimePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(value: string | Date | undefined | null): string {
    if (!value) return '';

    const dateStr =
      typeof value === 'string' && !value.endsWith('Z') && !value.includes('+')
        ? value + 'Z'
        : value;
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const isAr = this.languageService.current() === 'ar';

    if (diffSec < 60) return isAr ? 'الآن' : 'just now';
    if (diffMin < 60) return isAr ? `منذ ${diffMin} دقيقة` : `${diffMin} minute(s) ago`;
    if (diffHour < 24) return isAr ? `منذ ${diffHour} ساعة` : `${diffHour} hour(s) ago`;
    if (diffDay < 7) return isAr ? `منذ ${diffDay} يوم` : `${diffDay} day(s) ago`;

    return new Date(value).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
