import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EventPayload {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED';
  venueId?: number | null;
  venueName?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';


  createEvent(payload: EventPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/v1/events`, payload);
  }

  getEventById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/v1/events/${id}`);
  }


  updateEvent(id: number, payload: EventPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/v1/events/${id}`, payload);
  }


  getPublicEvents(page: number = 0, size: number = 100): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/public/events?page=${page}&size=${size}`);
  }

  getOrganizerEvents(page: number = 0, size: number = 100): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/v1/events?page=${page}&size=${size}`);
  }


  getEventDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/public/events/${id}`);
  }


  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/v1/files/upload`, formData);
  }
  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/v1/events/${id}`);
  }
}
