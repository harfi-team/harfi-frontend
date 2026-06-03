import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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

  handle(httpError: HttpErrorResponse | Error): void {
    const fallback = 'حدث خطأ، حاول مرة أخرى';
    const err = httpError instanceof HttpErrorResponse ? httpError.error?.message : httpError.message;
    const message = err ?? fallback;
    this.toast$.next({ type: 'error', message });
  }
}
