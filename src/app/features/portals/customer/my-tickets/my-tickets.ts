import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TicketService } from '../../../../core/services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TicketDto } from '../../../../core/models/ticket.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

/** UI-enriched ticket shape used by the template */
export interface Ticket {
  id: string;
  bookingId?: number;
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
function ticketDtoToUi(dto: TicketDto, index: number): Ticket {
  // Extract seat number if embedded in ticketNumber (e.g. "TKN-7E658B-1" -> "Seat #1")
  let formattedSeat = `Seat #${index + 1}`;
  if (dto.ticketNumber && dto.ticketNumber.includes('-')) {
    const parts = dto.ticketNumber.split('-');
    const lastPart = parts[parts.length - 1];
    if (!isNaN(Number(lastPart))) {
      formattedSeat = `Seat #${lastPart}`;
    }
  }

  return {
    id: dto.ticketNumber ?? `TKN-${dto.id}`,
    bookingId: dto.bookingId,
    movieTitle: dto.eventName || 'Cinema Screening',
    posterUrl: undefined,
    cinemaName: 'Hypercell Cinema',
    seatCategory: dto.seatCategoryName || 'STANDARD',
    seatNumber: formattedSeat,
    bookingDate: dto.bookingDate
      ? new Date(dto.bookingDate).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
      : '—',
    showtime: dto.bookingDate
      ? new Date(dto.bookingDate).toLocaleString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
      : '—',
    price: dto.totalPrice ?? 0,
    status: dto.bookingStatus === 'CANCELLED'
      ? 'CANCELLED'
      : dto.bookingStatus === 'COMPLETED'
        ? 'COMPLETED'
        : dto.isBooked
          ? 'UPCOMING'
          : 'COMPLETED',
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
    MatDialogModule,
  ],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.css',
})
export class MyTickets implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  // Data & UI state signals
  readonly tickets = signal<Ticket[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccessBanner = signal<boolean>(false);
  readonly cancellingBookingId = signal<number | null>(null);
  readonly cancellationMessage = signal<string | null>(null);

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
        const mapped = (dtos || []).map((dto, idx) => ticketDtoToUi(dto, idx));
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

  cancelBooking(ticket: Ticket): void {
    if (!ticket.bookingId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel booking?',
        message: `Are you sure you want to cancel your booking for ${ticket.movieTitle}?`,
        confirmText: 'Cancel Booking',
        cancelText: 'Keep Booking',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed || !ticket.bookingId) return;

      this.cancellingBookingId.set(ticket.bookingId);
      this.cancellationMessage.set(null);
      this.errorMessage.set(null);

      this.ticketService.cancelBooking(ticket.bookingId).subscribe({
        next: () => {
          this.tickets.update((tickets) =>
            tickets.map((currentTicket) =>
              currentTicket.bookingId === ticket.bookingId
                ? { ...currentTicket, status: 'CANCELLED' }
                : currentTicket
            )
          );
          this.cancellationMessage.set('Booking cancelled successfully.');
          this.cancellingBookingId.set(null);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message ??
              (typeof err?.error === 'string' ? err.error : 'Unable to cancel this booking.')
          );
          this.cancellingBookingId.set(null);
        },
      });
    });
  }
}
