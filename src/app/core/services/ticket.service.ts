import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TicketDto } from '../models/ticket.model';
import { BookingCreateRequest, BookingResponse } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * GET /api/tickets/user/{userId}
   * Fetch all tickets belonging to the authenticated user.
   */
  getUserTickets(userId: number): Observable<TicketDto[]> {
    return this.http.get<TicketDto[]>(`${this.apiUrl}/tickets/user/${userId}`);
  }

  /**
   * POST /api/bookings
   * Create a new ticket booking reservation.
   */
  createBooking(payload: BookingCreateRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/bookings`, payload);
  }

  /**
   * PATCH /api/bookings/{bookingId}/cancel
   * Cancel a booking and restore seat availability.
   */
  cancelBooking(bookingId: number): Observable<string> {
    return this.http.patch<string>(
      `${this.apiUrl}/bookings/${bookingId}/cancel`,
      {}
    );
  }
}
