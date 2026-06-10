import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CraftsmanService } from '../craftsman.service';
import { CraftsmanRegistrationDto } from '../../../core/models/craftsman.models';
@Component({
  selector: 'app-craftsman-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './craftsman-register.component.html',
  styleUrls: ['./craftsman-register.component.css']
})
export class CraftsmanRegisterComponent implements OnInit {
  registerForm!: FormGroup;
  selectedFileName: string = '';
  isSubmitted: boolean = false;
  errorMessage: string = '';

 serviceTypes: string[] = ['سباكة', 'كهرباء', 'نجارة', 'دهان', 'تكييف', 'تنظيف', 'أخرى'];


  constructor(
    private fb: FormBuilder,
    private craftsmanService: CraftsmanService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      userId: [1],
      serviceType: ['', Validators.required],
      city: ['', Validators.required],
      neighborhood: ['', Validators.required],
      priceRangeMin: [0, [Validators.required, Validators.min(0)]],
      priceRangeMax: [0, [Validators.required, Validators.min(0)]],
      experience: [1, [Validators.required, Validators.min(0)]],
      bio: ['', [Validators.required, Validators.maxLength(300)]],
      nationalIdUrl: ['', Validators.required]
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const payload = this.registerForm.value;
      this.craftsmanService.registerCraftsman(payload).subscribe({
        next: (response) => {
          this.isSubmitted = true;
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = 'حدث خطأ أثناء إرسال البيانات. يرجى المحاولة لاحقاً.';
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  // ======= الدوال الجديدة التي تم إضافتها لحل الإيرورز =======
  incrementExperience(): void {
    const currentVal = this.registerForm.get('experience')?.value || 0;
    this.registerForm.get('experience')?.setValue(currentVal + 1);
  }

  decrementExperience(): void {
    const currentVal = this.registerForm.get('experience')?.value || 0;
    if (currentVal > 0) {
      this.registerForm.get('experience')?.setValue(currentVal - 1);
    }
  }

  setServiceType(type: string): void {
    this.registerForm.get('serviceType')?.setValue(type);
  }
}