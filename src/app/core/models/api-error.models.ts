export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}
