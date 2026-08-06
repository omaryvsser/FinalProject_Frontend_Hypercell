import { Component, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type UserRole = 'GUEST' | 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private router: Router | null = null;
  private destroyRef: DestroyRef | null = null;

  readonly currentUserRole = signal<UserRole>('GUEST');

  constructor() {
    try {
      this.router = inject(Router);
    } catch {
      this.router = null;
    }

    try {
      this.destroyRef = inject(DestroyRef);
    } catch {
      this.destroyRef = null;
    }

    if (this.router) {
      this.updateRoleFromUrl(this.router.url);

      const navEvents$ = this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      );

      if (this.destroyRef) {
        navEvents$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
          this.updateRoleFromUrl(event.urlAfterRedirects || event.url);
        });
      } else {
        navEvents$.subscribe((event) => {
          this.updateRoleFromUrl(event.urlAfterRedirects || event.url);
        });
      }
    }
  }

  updateRoleFromUrl(url: string): void {
    if (!url) {
      this.currentUserRole.set('GUEST');
      return;
    }

    if (url.startsWith('/admin')) {
      this.currentUserRole.set('ADMIN');
    } else if (url.startsWith('/organizer')) {
      this.currentUserRole.set('ORGANIZER');
    } else if (url.startsWith('/my-tickets')) {
      this.currentUserRole.set('CUSTOMER');
    } else {
      this.currentUserRole.set('GUEST');
    }
  }

  logout(): void {
    this.currentUserRole.set('GUEST');
    if (this.router) {
      this.router.navigate(['/login']);
    }
  }
}
