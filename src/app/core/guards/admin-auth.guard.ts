import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

export const adminAuthGuard: CanActivateFn = () => {
  const admin = inject(AdminService);
  const router = inject(Router);
  return admin.isAdminLoggedIn() ? true : router.createUrlTree(['/admin/login']);
};
