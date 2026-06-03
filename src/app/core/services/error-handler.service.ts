import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastMessage } from '../models/api-error.models';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  toast$ = new Subject<ToastMessage>();

  success(message: string): void {
    this.toast$.next({ type: 'success', message });
  }

  error(message: string): void {
    this.toast$.next({ type: 'error', message });
  }

  info(message: string): void {
    this.toast$.next({ type: 'info', message });
  }

  handle(httpError: any): void {
    const fallback = 'حدث خطأ، حاول مرة أخرى';
    const message = httpError?.error?.message || httpError?.message || fallback;
    this.toast$.next({ type: 'error', message });
  }
}
