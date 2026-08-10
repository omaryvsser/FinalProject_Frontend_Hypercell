import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EventResponse, EventDetailResponse } from '../models/event.model';
import { PaginatedResponse } from '../models/pagination.model';

export interface EventPayload {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  director?: string;
  durationMinutes?: number | null;
  language?: string;
  venueId?: number | null;
  venueName?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Signal State Management
  private readonly organizerEventsSignal = signal<EventResponse[]>([]);
  readonly organizerEvents = this.organizerEventsSignal.asReadonly();

  private readonly publicEventsSignal = signal<EventResponse[]>([]);
  readonly publicEvents = this.publicEventsSignal.asReadonly();

  private readonly isLoadingSignal = signal<boolean>(false);
  readonly isLoading = this.isLoadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly eventError = this.errorSignal.asReadonly();

  /**
   * POST /api/v1/events
   * Create a new event (Organizer feature)
   */
  createEvent(payload: EventPayload): Observable<EventResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<EventResponse>(`${this.apiUrl}/v1/events`, payload).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, 'Failed to create event. Please check inputs.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * GET /api/v1/events/{id}
   */
  getEventById(id: number): Observable<EventDetailResponse | EventResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<EventDetailResponse | EventResponse>(`${this.apiUrl}/v1/events/${id}`).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, `Failed to load event #${id}`);
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * PUT /api/v1/events/{id}
   */
  updateEvent(id: number, payload: EventPayload): Observable<EventResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<EventResponse>(`${this.apiUrl}/v1/events/${id}`, payload).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, 'Failed to update event.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * GET /api/public/events?page={pageNumber}&size=5
   * Server-side paginated public events
   */
  getPublicEvents(page: number = 1, size: number = 5): Observable<PaginatedResponse<EventResponse>> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const pageIndex = Math.max(0, page - 1);
    const params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<EventResponse>>(`${this.apiUrl}/public/events`, { params }).pipe(
      tap({
        next: (res) => {
          if (res?.content) {
            this.publicEventsSignal.set(res.content);
          }
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, 'Failed to load public events catalog.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * GET /api/v1/events?page={pageNumber}&size=5
   * Server-side paginated organizer event listing
   */
  getOrganizerEvents(page: number = 1, size: number = 5): Observable<PaginatedResponse<EventResponse>> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const pageIndex = Math.max(0, page - 1);
    const params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<EventResponse>>(`${this.apiUrl}/v1/events`, { params }).pipe(
      tap({
        next: (res) => {
          if (res?.content) {
            this.organizerEventsSignal.set(res.content);
          }
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, 'Failed to load organizer events.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * GET /api/public/events/{id}
   */
  getEventDetails(id: number): Observable<EventDetailResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<EventDetailResponse>(`${this.apiUrl}/public/events/${id}`).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, `Failed to fetch details for event #${id}`);
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * POST /api/v1/files/upload
   */
  uploadImage(file: File): Observable<{ imageUrl: string }> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/v1/files/upload`, formData).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, 'Image upload failed.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * PATCH /api/v1/events/{id}/status
   */
  patchEventStatus(id: number, status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'): Observable<EventResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.patch<EventResponse>(`${this.apiUrl}/v1/events/${id}/status`, { status }).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, `Failed to update status for event #${id}`);
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * GET /api/v1/events/{eventId}/seat-categories
   */
  getSeatCategories(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/v1/events/${eventId}/seat-categories`);
  }

  /**
   * POST /api/v1/events/{eventId}/seat-categories
   */
  addSeatCategory(eventId: number, payload: { name: string; price: number; totalSeats: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/v1/events/${eventId}/seat-categories`, { ...payload, eventId });
  }

  /**
   * PUT /api/v1/events/{eventId}/seat-categories/{categoryId}
   */
  updateSeatCategory(eventId: number, categoryId: number, payload: Partial<{ name: string; price: number; totalSeats: number }>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/v1/events/${eventId}/seat-categories/${categoryId}`, payload);
  }

  /**
   * DELETE /api/v1/events/{eventId}/seat-categories/{categoryId}
   */
  deleteSeatCategory(eventId: number, categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/v1/events/${eventId}/seat-categories/${categoryId}`);
  }

  /**
   * DELETE /api/v1/events/{id}
   */
  deleteEvent(id: number): Observable<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<void>(`${this.apiUrl}/v1/events/${id}`).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const errorMsg = this.extractErrorMessage(err, `Failed to delete event #${id}`);
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
    if (err.error?.message) {
      return err.error.message;
    }
    if (typeof err.error === 'string') {
      return err.error;
    }
    if (err.status === 400) {
      return 'Validation failed. Please check form inputs.';
    }
    if (err.status === 401 || err.status === 403) {
      return 'Unauthorized action. Organizer login required.';
    }
    if (err.status === 404) {
      return 'Requested event was not found.';
    }
    return fallback;
  }
}
