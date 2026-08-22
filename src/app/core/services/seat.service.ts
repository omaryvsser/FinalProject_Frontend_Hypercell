import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Seat, SeatMapLayout } from '../models/seat.model';

@Injectable({
  providedIn: 'root'
})
export class SeatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * GET /api/events/{eventId}/seats
   * Retrieves seats with real-time availability and dynamic pricing.
   */
  getEventSeats(eventId: number): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.apiUrl}/events/${eventId}/seats`);
  }

  /**
   * GET /api/events/{eventId}/seats/layout
   * Retrieves full seat layout including rows and category information.
   */
  getSeatMapLayout(eventId: number): Observable<SeatMapLayout> {
    return this.http.get<SeatMapLayout>(`${this.apiUrl}/events/${eventId}/seats/layout`);
  }
}
