import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Venue {
  id: number;
  name: string;
  address?: string;
  capacity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VenueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/venues`;

  private readonly venuesSignal = signal<Venue[]>([]);
  readonly venues = this.venuesSignal.asReadonly();

  private readonly isLoadingSignal = signal<boolean>(false);
  readonly isLoading = this.isLoadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly venueError = this.errorSignal.asReadonly();

  /**
   * GET /api/venues
   * Fetch all registered cinema venues (Used by Organizers and Admins)
   */
  getVenues(): Observable<Venue[]> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Venue[]>(this.apiUrl).pipe(
      tap({
        next: (venueList) => {
          this.venuesSignal.set(venueList || []);
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, 'Failed to load venues.');
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * GET /api/venues/{id}
   */
  getVenueById(id: number): Observable<Venue> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Venue>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, `Failed to load venue #${id}`);
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * POST /api/venues
   * Create a new venue (Admin action)
   */
  createVenue(venue: Omit<Venue, 'id'>): Observable<Venue> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Venue>(this.apiUrl, venue).pipe(
      tap({
        next: (created) => {
          this.venuesSignal.update((list) => [...list, created]);
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, 'Failed to create venue.');
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * PUT /api/venues/{id}
   * Update an existing venue (Admin action)
   */
  updateVenue(id: number, venue: Partial<Venue>): Observable<Venue> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<Venue>(`${this.apiUrl}/${id}`, venue).pipe(
      tap({
        next: (updated) => {
          this.venuesSignal.update((list) =>
            list.map((v) => (v.id === id ? updated : v))
          );
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, `Failed to update venue #${id}`);
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * DELETE /api/venues/{id}
   * Delete a venue (Admin action)
   */
  deleteVenue(id: number): Observable<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => {
          this.venuesSignal.update((list) => list.filter((v) => v.id !== id));
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = this.extractErrorMessage(err, `Failed to delete venue #${id}`);
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
    if (err.status === 400) return 'Invalid venue details provided.';
    if (err.status === 401 || err.status === 403) return 'Unauthorized action. Admin privileges required.';
    if (err.status === 404) return 'Venue not found.';
    return fallback;
  }
}
