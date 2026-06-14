import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // 👈 دي أهم كلمة! بتعرف الأنجولار إنه يراقب التغييرات باستمرار
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private onLangChange?: Subscription;

  transform(key: string): string {
    if (!key) return '';

    // لو مفيش اشتراك في تغيير اللغة، بنعمل واحد علشان يعمل ريفرش للـ UI أول ما اللغة تتغير
    if (!this.onLangChange) {
      this.onLangChange = this.translate.onLangChange.subscribe(() => {
        this.cdr.markForCheck(); // بيجبر الكامبوننت يعيد رسم النص باللغة الجديدة
      });
    }

    // إرجاع الترجمة الحالية للـ Key
    return this.translate.instant(key);
  }

  ngOnDestroy(): void {
    // تنظيف الـ Subscription من الذاكرة منقذاً للـ Performance
    if (this.onLangChange) {
      this.onLangChange.unsubscribe();
    }
  }
}