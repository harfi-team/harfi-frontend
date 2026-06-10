import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import{CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CraftsmanService } from '../craftsman.service';
import { CraftsmanCardDto, CraftsmanSearchFilters } from '../../../core/models/craftsman.models';

@Component({
  selector: 'app-craftsman-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './craftsman-search.component.html',
  styleUrls: ['./craftsman-search.component.css']
})
export class CraftsmanSearchComponent implements OnInit {
  craftsmen: CraftsmanCardDto[] = [];
  filteredCraftsmen: CraftsmanCardDto[] = [];
  isLoading: boolean = false;

  // القيم المتاحة بالفلاتر (يمكنكِ تعديلها حسب الحاجة)
  servicesList: string[] = ['اخرى','سباكة', 'كهرباء', 'نجارة', 'تنظيف'];
  citiesList: string[] = ['طنطا', 'القاهرة', 'الإسكندرية', 'المنصورة'];

  // كائن الفلاتر الحالي لشاشتنا
 filters: any = {
  serviceType: '',
  city: '',
  minRating: 0,
  minExperience: 0,
  searchTerm: '',
  priceRangeMin: 0,    // التعديل الجديد للسعر الأدنى
  priceRangeMax: 1000  // التعديل الجديد للسعر الأقصى
};

  constructor(
    private craftsmanService: CraftsmanService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCraftsmen();
  }

  // جلب البيانات من السيرفر بالتزامن مع الفلاتر
  loadCraftsmen(): void {
    this.isLoading = true;
    this.craftsmanService.searchCraftsmen(this.filters).subscribe({
      next: (data) => {
        this.craftsmen = data;
        this.applyFrontendSearch(); // لتطبيق البحث النصي العلوي إذا وُجد
        this.isLoading = false;
      },
      error: (err) => {
        console.error('حدث خطأ أثناء جلب الحرفيين:', err);
        this.isLoading = false;
      }
    });
  }

  // فلترة إضافية في الفرونت اند للبحث النصي (الاسم أو السيرة الذاتية)
  applyFrontendSearch(): void {
    if (!this.filters.searchTerm) {
      this.filteredCraftsmen = this.craftsmen;
      return;
    }
    const term = this.filters.searchTerm.toLowerCase();
    this.filteredCraftsmen = this.craftsmen.filter(c => 
      c.fullName.toLowerCase().includes(term) || 
      (c.bio && c.bio.toLowerCase().includes(term))
    );
  }

  // لتحديث فلاتر الخدمات (Checkbox أو Radio)
  onServiceSelect(service: string): void {
    this.filters.serviceType = this.filters.serviceType === service ? '' : service;
    this.loadCraftsmen();
  }

  // لتحديث تقييم النجوم
  onRatingSelect(rating: number): void {
    this.filters.minRating = this.filters.minRating === rating ? 0 : rating;
    this.loadCraftsmen();
  }

  // مسح جميع الفلاتر لإعادة تصفير الصفحة
  clearAllFilters(): void {
  this.filters = {
    serviceType: '',
    city: '',
    minRating: 0,
    minExperience: 0,
    searchTerm: '',
    priceRangeMin: 0,
    priceRangeMax: 1000
  };
  this.loadCraftsmen();
}

  // الانتقال لصفحة البروفايل عند الضغط على الكارت أو زر عرض/حجز
  viewProfile(id: number): void {
    this.router.navigate(['/craftsman/profile', id]);
  }
}