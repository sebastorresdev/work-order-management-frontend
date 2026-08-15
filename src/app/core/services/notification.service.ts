import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  workOrderId?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/notifications`;

  notifications = signal<NotificationItem[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  private intervalId: any;

  startPolling(): void {
    this.loadNotifications();
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.loadNotifications(), 30000);
    }
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  loadNotifications(): void {
    this.http.get<NotificationItem[]>(this.apiUrl).subscribe({
      next: (res) => this.notifications.set(res || []),
      error: () => {}
    });
  }

  markAsRead(id: string): void {
    this.http.put<void>(`${this.apiUrl}/${id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    });
  }

  markAllAsRead(): void {
    this.http.put<void>(`${this.apiUrl}/read-all`, {}).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => ({ ...n, isRead: true }))
        );
      }
    });
  }
}
