import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingCreateRequest, BookingResponse } from '../models/booking.model';
import { PaginatedResponse } from '../models/pagination.model';

export interface BookingDetails {
  id?: string;
  eventId?: number;
  movieId?: number;
  movieTitle?: string;
  showtime?: string;
  cinemaName?: string;
  seatCategoryId?: number;
  ticketCount: number;
  ticketPrice: number;
  totalPrice?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate?: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private currentBookingSignal = signal<BookingDetails | null>(null);
  readonly currentBooking = this.currentBookingSignal.asReadonly();

  private errorSignal = signal<string | null>(null);
  readonly bookingError = this.errorSignal.asReadonly();

  private loadingSignal = signal<boolean>(false);
  readonly isLoading = this.loadingSignal.asReadonly();

  initiateBooking(movie: { id: number; title: string; showtime: string; cinemaName: string; price?: number; seatCategoryId?: number }) {
    this.errorSignal.set(null);
    this.currentBookingSignal.set({
      eventId: movie.id,
      movieId: movie.id,
      movieTitle: movie.title,
      showtime: movie.showtime || 'Friday, 8:00 PM',
      cinemaName: movie.cinemaName || 'Hypercell Cinema',
      seatCategoryId: movie.seatCategoryId || 1,
      ticketCount: 1,
      ticketPrice: movie.price || 150,
      customerName: '',
      customerEmail: '',
      customerPhone: ''
    });
  }

  /**
   * POST /api/bookings
   */
  createBooking(payload: BookingCreateRequest): Observable<BookingResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<BookingResponse>(`${this.apiUrl}/bookings`, payload).pipe(
      tap({
        next: () => this.loadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.loadingSignal.set(false);
          const errorMsg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Booking failed. Please try again.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * GET /api/bookings?page={pageNumber}&size={pageSize}
   * Retrieves all system bookings paginated for Admin view.
   */
  getPaginatedBookings(page: number = 1, size: number = 5): Observable<PaginatedResponse<BookingResponse>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const pageIndex = Math.max(0, page - 1);
    const params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<BookingResponse>>(`${this.apiUrl}/bookings`, { params }).pipe(
      tap({
        next: () => this.loadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.loadingSignal.set(false);
          const errorMsg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to load bookings.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * GET /api/bookings/organizer?page={pageNumber}&size={pageSize}
   * Retrieves paginated bookings for currently authenticated organizer's events.
   */
  getOrganizerBookings(page: number = 1, size: number = 5): Observable<PaginatedResponse<BookingResponse>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const pageIndex = Math.max(0, page - 1);
    const params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<BookingResponse>>(`${this.apiUrl}/bookings/organizer`, { params }).pipe(
      tap({
        next: () => this.loadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.loadingSignal.set(false);
          const errorMsg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to load organizer bookings.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * PATCH /api/bookings/{id}/cancel
   * Cancels a booking and restores seat capacity.
   */
  cancelBooking(bookingId: number): Observable<string> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.patch(`${this.apiUrl}/bookings/${bookingId}/cancel`, {}, { responseType: 'text' }).pipe(
      tap({
        next: () => this.loadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.loadingSignal.set(false);
          const errorMsg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to cancel booking.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  /**
   * PATCH /api/bookings/{id}/status
   * Updates booking status with role-based validation on server.
   */
  updateBookingStatus(bookingId: number, status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'): Observable<BookingResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.patch<BookingResponse>(`${this.apiUrl}/bookings/${bookingId}/status`, { status }).pipe(
      tap({
        next: () => this.loadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.loadingSignal.set(false);
          const errorMsg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to update booking status.');
          this.errorSignal.set(errorMsg);
        }
      })
    );
  }

  confirmBooking(formData?: Partial<BookingDetails>): BookingDetails | null {
    const current = this.currentBookingSignal();
    if (!current && !formData) return null;

    const ticketCount = formData?.ticketCount || current?.ticketCount || 1;
    const ticketPrice = current?.ticketPrice || 150;

    const confirmedBooking: BookingDetails = {
      ...current,
      ...formData,
      id: 'BK-' + Math.floor(100000 + Math.random() * 900000),
      bookingDate: new Date(),
      ticketCount,
      ticketPrice,
      totalPrice: ticketCount * ticketPrice
    } as BookingDetails;

    this.currentBookingSignal.set(confirmedBooking);
    return confirmedBooking;
  }

  clearCurrentBooking() {
    this.currentBookingSignal.set(null);
  }

  clearError() {
    this.errorSignal.set(null);
  }
}