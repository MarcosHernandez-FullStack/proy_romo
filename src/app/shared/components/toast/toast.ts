import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
})
export class Toast {
  protected readonly notif = inject(NotificationService);
}
