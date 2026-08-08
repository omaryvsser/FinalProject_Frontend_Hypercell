import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDto, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly usersSignal = signal<UserDto[]>([]);
  readonly users = this.usersSignal.asReadonly();

  private readonly isLoadingSignal = signal<boolean>(false);
  readonly isLoading = this.isLoadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly userError = this.errorSignal.asReadonly();

  /**
   * GET /api/admin/users
   * Fetch all registered users for Admin management.
   */
  getAllUsers(): Observable<UserDto[]> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<UserDto[]>(`${this.apiUrl}/admin/users`).pipe(
      tap({
        next: (users) => {
          this.usersSignal.set(users || []);
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, 'Failed to load user list.');
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * GET /api/v1/users/{id}
   */
  getUserById(id: number): Observable<UserDto> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<UserDto>(`${this.apiUrl}/v1/users/${id}`).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, `Failed to fetch details for user #${id}`);
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * PUT /api/admin/users/{id}/role
   */
  updateUserRole(id: number, role: UserRole): Observable<UserDto> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<UserDto>(`${this.apiUrl}/admin/users/${id}/role`, { role }).pipe(
      tap({
        next: (updatedUser) => {
          this.usersSignal.update((list) =>
            list.map((u) => (u.id === id ? updatedUser : u))
          );
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, `Failed to update user role for user #${id}`);
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * DELETE /api/admin/users/{id}
   */
  deleteUser(id: number): Observable<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<void>(`${this.apiUrl}/admin/users/${id}`).pipe(
      tap({
        next: () => {
          this.usersSignal.update((list) => list.filter((u) => u.id !== id));
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, `Failed to delete user #${id}`);
          this.errorSignal.set(msg);
        }
      })
    );
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
    if (err.error?.message) return err.error.message;
    if (typeof err.error === 'string') return err.error;
    if (err.status === 401 || err.status === 403) return 'Unauthorized action. Admin privileges required.';
    if (err.status === 404) return 'User not found.';
    return fallback;
  }
}
