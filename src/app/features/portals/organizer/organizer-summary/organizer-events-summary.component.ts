import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

// Added/Updated for Organizer Summary: Interfaces
export interface TicketBookingSummary {
  bookingId: number;
  userName: string;
  userEmail: string;
  categoryName: string;
  seatsBooked: number;
  totalPrice: number;
  bookingDate: string;
}

export interface EventOrganizerStats {
  eventId: number;
  eventTitle: string;
  totalTicketsSold: number;
  totalRevenue: number;
  bookings: TicketBookingSummary[];
}

@Component({
  selector: 'app-organizer-events-summary',
  standalone: true,
  imports: [CommonModule], // Added/Updated for Organizer Summary: Solves the 'date' pipe issue
  templateUrl: './organizer-events-summary.component.html',
  styleUrls: []
})
export class OrganizerEventsSummaryComponent implements OnInit {

  // Added/Updated for Organizer Summary: State Variables
  eventsList: any[] = [];
  isLoadingEvents: boolean = false;

  selectedEventId: number | null = null;
  organizerStats: EventOrganizerStats | null = null;
  isLoadingStats: boolean = false;

  private apiUrl = 'http://localhost:8080/api'; // عدل الـ URL حسب الباك إند عندك

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrganizerEvents();
  }

  // Added/Updated for Organizer Summary: Fetch all events for dropdown
  loadOrganizerEvents(): void {
    this.isLoadingEvents = true;
    this.http.get<any>(`${this.apiUrl}/events?page=0&size=50`).subscribe({
      next: (res: any) => {
        this.eventsList = res.content || res;
        this.isLoadingEvents = false;
      },
      error: (err) => {
        console.error('Error fetching events:', err);
        this.isLoadingEvents = false;
      }
    });
  }

  // Added/Updated for Organizer Summary: Fetch stats and buyers for selected event
  onSelectEvent(eventId: number): void {
    if (!eventId) return;
    this.selectedEventId = eventId;
    this.isLoadingStats = true;
    this.organizerStats = null;

    this.http.get<EventOrganizerStats>(`${this.apiUrl}/events/${eventId}/organizer-summary`).subscribe({
      next: (data: EventOrganizerStats) => {
        this.organizerStats = data;
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Error fetching event summary:', err);
        this.isLoadingStats = false;
      }
    });
  }
}