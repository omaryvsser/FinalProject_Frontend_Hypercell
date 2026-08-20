import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Navbar } from './navbar';
import { AuthService } from '../../../core/services/auth.service';
import { signal } from '@angular/core';

describe('Navbar Component', () => {
  let component: Navbar;
  const mockCurrentUser = signal<any>(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Navbar,
        {
          provide: AuthService,
          useValue: {
            currentUser: mockCurrentUser,
            isLoggedIn: signal(false),
            logout: () => mockCurrentUser.set(null),
          },
        },
      ],
    });
    mockCurrentUser.set(null);
    component = TestBed.inject(Navbar);
  });

  it('should create navbar component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to GUEST role', () => {
    expect(component.currentUserRole()).toBe('GUEST');
  });

  it('should derive role from currentUser signal', () => {
    mockCurrentUser.set({ email: 'admin@cinema.eg', role: 'ADMIN' });
    expect(component.currentUserRole()).toBe('ADMIN');

    mockCurrentUser.set({ email: 'org@cinema.eg', role: 'ORGANIZER' });
    expect(component.currentUserRole()).toBe('ORGANIZER');

    mockCurrentUser.set({ email: 'cust@cinema.eg', role: 'CUSTOMER' });
    expect(component.currentUserRole()).toBe('CUSTOMER');
  });
});

