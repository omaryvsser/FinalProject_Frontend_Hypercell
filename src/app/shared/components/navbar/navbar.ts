import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

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
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  // Mobile drawer state signal
  readonly mobileMenuOpen = signal<boolean>(false);

  // Expose auth state directly to template
  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  // Dynamically derive role from logged in user or fallback to 'GUEST'
  readonly currentUserRole = computed<UserRole>(() => {
    const user = this.currentUser();
    if (!user) return 'GUEST';
    return (user.role as UserRole) || 'CUSTOMER';
  });

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
