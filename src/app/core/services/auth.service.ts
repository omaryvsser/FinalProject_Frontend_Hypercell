import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export type UserRole = 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';

export interface JwtPayload {
  sub: string;
  id?: number | string;
  name?: string;
  userId?: number | string;
  role?: UserRole;
  roles?: string[] | string;
  exp?: number;
}

export interface UserSession {
  id: number | null;
  email: string;
  name: string;
  role: UserRole | null;
}

/**
 * Authentication service handling JWT token storage, decoding, login, registration, and user sessions.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly TOKEN_KEY = 'jwt';

  // Reactive state signals
  private readonly tokenSignal = signal<string | null>(this.getToken());
  private readonly errorSignal = signal<string | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  /** Public reactive session computed signal */
  readonly currentUser = computed<UserSession | null>(() => {
    const token = this.tokenSignal();
    if (!token) return null;

    const payload = this.decodeTokenString(token);
    if (!payload) return null;
    const email = payload.sub || '';
    const name = payload.name || (email.includes('@') ? email.split('@')[0] : email) || 'User';

    return {
      id: this.getUserIdFromPayload(payload),
      email: payload.sub,
      role: this.getRoleFromPayload(payload),
      name: name,
    };
  });

  readonly isAuthenticated = computed<boolean>(() => !!this.currentUser());
  readonly authError = this.errorSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  /** Authenticates user credentials via POST /api/v1/auth/login */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/v1/auth/login`,
      credentials
    ).pipe(
      tap({
        next: (res) => {
          this.loadingSignal.set(false);
          if (res?.token) this.storeToken(res.token);
        },
        error: (err: HttpErrorResponse) => {
          this.loadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, 'Login failed. Please check credentials.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /** Registers a new account via POST /api/v1/auth/register */
  register(payload: RegisterRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/v1/auth/register`,
      payload
    ).pipe(
      tap({
        next: (res) => {
          this.loadingSignal.set(false);
          if (res?.token) this.storeToken(res.token);
        },
        error: (err: HttpErrorResponse) => {
          this.loadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, 'Registration failed. Please try again.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /** Clears any active authentication errors */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /** Persists JWT token to localStorage & updates state signal */
  storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  /** Retrieves raw JWT string from localStorage */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Clears active session and logs out user */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.tokenSignal.set(null);
    this.errorSignal.set(null);
  }

  /** Checks if user is authenticated */
  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  /** Decodes JWT payload */
  decodeToken(): JwtPayload | null {
    const token = this.getToken();
    return token ? this.decodeTokenString(token) : null;
  }

  /** Helper method to parse Base64 JWT string */
  private decodeTokenString(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as JwtPayload;
    } catch {
      return null;
    }
  }

  /** Retrieves numeric user ID from active JWT session */
  getUserIdFromToken(): number | null {
    const payload = this.decodeToken();
    return payload ? this.getUserIdFromPayload(payload) : null;
  }

  private getUserIdFromPayload(payload: JwtPayload): number | null {
    const rawId = payload.id ?? payload.userId;
    if (rawId === undefined || rawId === null || rawId === '') return null;
    const userId = Number(rawId);
    return Number.isFinite(userId) ? userId : null;
  }

  /** Retrieves user role enum from active JWT session */
  getRoleFromToken(): UserRole | null {
    const payload = this.decodeToken();
    return payload ? this.getRoleFromPayload(payload) : null;
  }

  private getRoleFromPayload(payload: JwtPayload): UserRole | null {
    const rawRole = payload.role ?? (Array.isArray(payload.roles) ? payload.roles[0] : payload.roles);
    if (!rawRole) return null;
    const role = String(rawRole).replace(/^ROLE_/, '') as UserRole;
    return ['CUSTOMER', 'ORGANIZER', 'ADMIN'].includes(role) ? role : null;
  }

  private extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
    if (err.error?.message) return err.error.message;
    if (typeof err.error === 'string') return err.error;
    if (err.status === 400) return 'Invalid request details provided.';
    if (err.status === 401) return 'Invalid credentials. Please check your email and password.';
    if (err.status === 403) return 'Access denied.';
    return fallback;
  }
}
