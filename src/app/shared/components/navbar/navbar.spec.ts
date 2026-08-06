import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Navbar } from './navbar';

describe('Navbar Component', () => {
  let component: Navbar;

  beforeEach(() => {
    component = new Navbar();
  });

  it('should create navbar component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to GUEST role', () => {
    expect(component.currentUserRole()).toBe('GUEST');
  });

  it('should compute role automatically based on URL path', () => {
    component.updateRoleFromUrl('/admin');
    expect(component.currentUserRole()).toBe('ADMIN');

    component.updateRoleFromUrl('/organizer/movies/new');
    expect(component.currentUserRole()).toBe('ORGANIZER');

    component.updateRoleFromUrl('/my-tickets');
    expect(component.currentUserRole()).toBe('CUSTOMER');

    component.updateRoleFromUrl('/');
    expect(component.currentUserRole()).toBe('GUEST');
  });

  it('should reset role to GUEST on logout', () => {
    component.updateRoleFromUrl('/admin');
    component.logout();
    expect(component.currentUserRole()).toBe('GUEST');
  });
});
