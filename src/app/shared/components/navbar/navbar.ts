import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Adjust path if needed

export type UserRole = 'GUEST' | 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Expose auth state directly to template
  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  // Dynamically derive role from logged in user or fallback to 'GUEST'
  readonly currentUserRole = computed<UserRole>(() => {
    const user = this.currentUser();
    if (!user) return 'GUEST';
    return (user.role as UserRole) || 'CUSTOMER';
  });

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
