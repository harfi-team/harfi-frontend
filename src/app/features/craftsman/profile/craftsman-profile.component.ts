import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CraftsmanService } from '../craftsman.service';
import { CraftsmanProfileDto, ReviewsResponseDto } from '../../../core/models/craftsman.models';
import{DatePipe} from '@angular/common';
@Component({
  selector: 'app-craftsman-profile',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './craftsman-profile.component.html',
  styleUrls: ['./craftsman-profile.component.css']
})
export class CraftsmanProfileComponent implements OnInit {
  craftsmanId!: number;
  profile!: CraftsmanProfileDto;
  reviewsData!: ReviewsResponseDto;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private craftsmanService: CraftsmanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.craftsmanId = +id;
        this.loadProfileData();
      }
    });
  }

  loadProfileData(): void {
    this.isLoading = true;
    
    // استخدام forkJoin لجلب البروفايل والتقييمات في نفس الوقت
    forkJoin({
      profile: this.craftsmanService.getCraftsmanProfile(this.craftsmanId),
      reviews: this.craftsmanService.getCraftsmanReviews(this.craftsmanId)
    }).subscribe({
      next: (res) => {
        this.profile = res.profile;
        this.reviewsData = res.reviews;
        
        // Mocking missing data for UI matching Figma if backend doesn't send it yet
        this.profile.serviceType = this.profile.serviceType || 'صنايعي عام';
        this.profile.rating = res.reviews.averageStars || 0;
        this.profile.skills = ['تفصيل مطابخ', 'غرف نوم', 'أبواب خشبية', 'صيانة وتجديد'];
        this.profile.previousWorks = [
          'assets/images/work1.jpg', 'assets/images/work2.jpg', 'assets/images/work3.jpg'
        ];
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('حدث خطأ في تحميل البيانات', err);
        this.isLoading = false;
      }
    });
  }

  onBookNow(): void {
    this.craftsmanService.bookJob(this.craftsmanId).subscribe({
      next: () => {
        alert('تم إرسال طلب الحجز بنجاح!');
      },
      error: (err) => alert('حدث خطأ أثناء الحجز.')
    });
  }

  onContact(): void {
    const payload = { craftsmanId: this.craftsmanId, jobId: 0 }; // 0 if no specific job is assigned yet
    this.craftsmanService.startConversation(payload).subscribe({
      next: () => {
        alert('تم فتح نافذة المحادثة!');
        // this.router.navigate(['/chat']);
      },
      error: (err) => alert('حدث خطأ أثناء محاولة التواصل.')
    });
  }
  
  // لإنشاء مصفوفة للنجوم في الـ HTML
  getStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }
}