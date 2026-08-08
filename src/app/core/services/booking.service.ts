import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingCreateRequest, BookingResponse } from '../models/booking.model';

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