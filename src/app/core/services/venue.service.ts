import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/venues'; // Adjust to your backend port/URL

  /**
   * Fetch all registered cinema venues (Used by Organizers and Admins)
   */
  getVenues(): Observable<Venue[]> {
    return this.http.get<Venue[]>(this.apiUrl);
  }

  /**
   * Get a single venue by ID
   */
  getVenueById(id: number): Observable<Venue> {
    return this.http.get<Venue>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new venue (Admin action)
   */
  createVenue(venue: Omit<Venue, 'id'>): Observable<Venue> {
    return this.http.post<Venue>(this.apiUrl, venue);
  }

  /**
   * Delete a venue (Admin action)
   */
  deleteVenue(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
