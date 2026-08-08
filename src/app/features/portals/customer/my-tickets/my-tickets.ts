import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
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
    cinemaName: 'Hypercell Cinema',
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
    price: 0,
    status: dto.isBooked ? 'UPCOMING' : 'COMPLETED',
  };
}

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
  private readonly route = inject(ActivatedRoute);

  // Data & UI state signals
  readonly tickets = signal<Ticket[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccessBanner = signal<boolean>(false);

  // Computed sub-lists for active vs past tickets
  readonly activeTickets = computed(() =>
    this.tickets().filter((t) => t.status === 'UPCOMING')
  );
  readonly pastTickets = computed(() =>
    this.tickets().filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED')
  );

  ngOnInit(): void {
    const isConfirmed = this.route.snapshot.queryParamMap.get('confirmed') === 'true';
    if (isConfirmed) {
      this.showSuccessBanner.set(true);
    }
    this.loadTickets();
  }

  /**
   * Fetch user tickets from GET /api/tickets/user/{userId}
   */
  loadTickets(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const userId = this.authService.getUserIdFromToken();

    if (userId === null) {
      this.errorMessage.set('User authentication required to view tickets.');
      this.isLoading.set(false);
      return;
    }

    this.ticketService.getUserTickets(userId).subscribe({
      next: (dtos: TicketDto[]) => {
        const mapped = (dtos || []).map(ticketDtoToUi);
        this.tickets.set(mapped);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tickets:', err);
        this.errorMessage.set(
          err?.error?.message ?? 'Unable to load tickets. Please try again later.'
        );
        this.isLoading.set(false);
      },
    });
  }
}
