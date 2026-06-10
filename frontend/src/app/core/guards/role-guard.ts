import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles: string[] = route.data['roles'] || [];

  if (requiredRoles.length === 0) return true;

  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }
  
  console.log('User role from token:', authService.getUserRole());
  console.log('Required roles:', requiredRoles)
  
  router.navigate(['/unauthorized']);
  return false;
};
