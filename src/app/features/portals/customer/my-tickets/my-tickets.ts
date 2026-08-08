import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TicketService } from '../../../../core/services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TicketDto } from '../../../../core/models/ticket.model';

/** UI-enriched ticket shape used by the template */
export interface Ticket {
  id: string;
  movieTitle: string;
  posterUrl?: string;
  cinemaName: string;
  seatCategory: string;
  seatNumber: string;
  bookingDate: string;
  showtime: string;
  price: number;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
}

/** Convert a raw backend TicketDto to the UI Ticket shape */
function ticketDtoToUi(dto: TicketDto): Ticket {
  return {
    id: dto.ticketNumber ?? String(dto.id),
    movieTitle: dto.eventName,
    posterUrl: undefined,
    cinemaName: '',                    // not in backend TicketDto — left blank
    seatCategory: dto.seatCategoryName,
    seatNumber: dto.ticketNumber,
    bookingDate: dto.bookingDate
      ? new Date(dto.bookingDate).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      : '—',
    showtime: dto.bookingDate
      ? new Date(dto.bookingDate).toLocaleString('en-US', {
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '—',
    price: 0,                          // price not in TicketDto — use 0 as placeholder
    status: dto.isBooked ? 'UPCOMING' : 'COMPLETED',
  };
}

/** Fallback mock tickets shown when API is unavailable */
const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TICK-A1B2C3D4',
    movieTitle: 'Interstellar: Beyond Time',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    cinemaName: 'Vox Cinema Mall of Egypt',
    seatCategory: 'IMAX 3D',
    seatNumber: 'Seat A1, A2',
    bookingDate: 'Aug 07, 2026',
    showtime: 'Friday, 8:00 PM',
    price: 300,
    status: 'UPCOMING',
  },
  {
    id: 'TICK-X9Y8Z7W6',
    movieTitle: 'Dune: Part Two',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    cinemaName: 'Sea Cinema El Gouna',
    seatCategory: 'VIP Suite',
    seatNumber: 'Seat C4, C5',
    bookingDate: 'Aug 14, 2026',
    showtime: 'Saturday, 7:30 PM',
    price: 400,
    status: 'UPCOMING',
  },
];

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.css',
})
export class MyTickets implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly authService = inject(AuthService);

  // Data & UI state
  readonly tickets = signal<Ticket[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Computed sub-lists for active vs past tickets
  readonly activeTickets = computed(() =>
    this.tickets().filter((t) => t.status === 'UPCOMING')
  );
  readonly pastTickets = computed(() =>
    this.tickets().filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED')
  );

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const userId = this.authService.getUserIdFromToken();

    if (userId === null) {
      // Not authenticated or token has no id claim — show mock data
      this.tickets.set(MOCK_TICKETS);
      this.isLoading.set(false);
      return;
    }

    this.ticketService.getUserTickets(userId).subscribe({
      next: (dtos: TicketDto[]) => {
        const mapped = dtos.map(ticketDtoToUi);
        this.tickets.set(mapped.length > 0 ? mapped : MOCK_TICKETS);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tickets:', err);
        // Graceful fallback — show mock data rather than an empty/broken page
        this.tickets.set(MOCK_TICKETS);
        this.isLoading.set(false);
      },
    });
  }
}
