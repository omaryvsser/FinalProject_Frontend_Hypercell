import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, of, tap, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TicketDto } from '../models/ticket.model';
import { BookingCreateRequest, BookingResponse } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly userTicketsSignal = signal<TicketDto[]>([]);
  readonly userTickets = this.userTicketsSignal.asReadonly();

  private readonly isLoadingSignal = signal<boolean>(false);
  readonly isLoading = this.isLoadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly ticketError = this.errorSignal.asReadonly();

  /**
   * GET /api/tickets/user/{userId} & GET /api/bookings/user/{userId}
   * Fetch all tickets and booking reservations belonging to the authenticated user.
   */
  getUserTickets(userId: number): Observable<TicketDto[]> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return forkJoin({
      tickets: this.http.get<TicketDto[]>(`${this.apiUrl}/tickets/user/${userId}`).pipe(
        catchError(() => of([] as TicketDto[]))
      ),
      bookings: this.http.get<BookingResponse[]>(`${this.apiUrl}/bookings/user/${userId}`).pipe(
        catchError(() => of([] as BookingResponse[]))
      )
    }).pipe(
      map(({ tickets, bookings }) => {
        const ticketList: TicketDto[] = (tickets || []).map((ticket) => {
          const booking = (bookings || []).find(
            (item) =>
              item.eventTitle === ticket.eventName &&
              item.seatCategoryName === ticket.seatCategoryName &&
              item.createdAt === ticket.bookingDate
          );

          return booking
            ? {
                ...ticket,
                bookingId: booking.bookingId,
                bookingStatus: booking.status,
                bookingQuantity: booking.quantity,
                totalPrice: booking.totalPrice,
              }
            : ticket;
        });

        if (bookings && bookings.length > 0) {
          bookings.forEach((b) => {
            const exists = ticketList.some((ticket) => ticket.bookingId === b.bookingId);
            if (!exists) {
              ticketList.push({
                id: b.bookingId,
                ticketNumber: `BK-${b.bookingId}`,
                eventName: b.eventTitle,
                seatCategoryName: b.seatCategoryName,
                isBooked: b.status !== 'CANCELLED',
                bookingDate: b.createdAt,
                bookingId: b.bookingId,
                bookingStatus: b.status,
                bookingQuantity: b.quantity,
                totalPrice: b.totalPrice,
              });
            }
          });
        }
        return ticketList;
      }),
      tap({
        next: (allTickets) => {
          this.userTicketsSignal.set(allTickets);
          this.isLoadingSignal.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to load user tickets. Please try again.');
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * POST /api/bookings
   * Create a new ticket booking reservation.
   */
  createBooking(payload: BookingCreateRequest): Observable<BookingResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<BookingResponse>(`${this.apiUrl}/bookings`, payload).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to create booking.');
          this.errorSignal.set(msg);
        }
      })
    );
  }

  /**
   * PATCH /api/bookings/{bookingId}/cancel
   * Cancel a booking and restore seat availability.
   */
  cancelBooking(bookingId: number): Observable<string> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.patch(
      `${this.apiUrl}/bookings/${bookingId}/cancel`,
      {},
      { responseType: 'text' }
    ).pipe(
      tap({
        next: () => this.isLoadingSignal.set(false),
        error: (err: HttpErrorResponse) => {
          this.isLoadingSignal.set(false);
          const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to cancel booking.');
          this.errorSignal.set(msg);
        }
      })
    );
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
