import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QRCodeComponent } from 'angularx-qrcode';
import { TicketService } from '../../../../core/services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TicketDto } from '../../../../core/models/ticket.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

export interface TicketPass {
  id: string;
  ticketCode: string;
  seatNumber: string;
}

export interface GroupedBooking {
  groupKey: string;
  bookingId?: number;
  movieTitle: string;
  posterUrl?: string;
  cinemaName: string;
  seatCategory: string;
  bookingDate: string;
  showtime: string;
  quantity: number;
  totalPrice: number;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  passes: TicketPass[];
}

/** Group individual TicketDtos into single Master Booking objects */
function groupTicketDtos(dtos: TicketDto[]): GroupedBooking[] {
  const map = new Map<string, GroupedBooking>();

  (dtos || []).forEach((dto, idx) => {
    const key = dto.bookingId
      ? `booking_${dto.bookingId}`
      : `${dto.eventName || 'Event'}_${dto.bookingDate || ''}_${dto.seatCategoryName || 'STANDARD'}`;

    let seatNum = `Seat #${idx + 1}`;
    if (dto.ticketNumber && dto.ticketNumber.includes('-')) {
      const parts = dto.ticketNumber.split('-');
      const lastPart = parts[parts.length - 1];
      if (!isNaN(Number(lastPart))) {
        seatNum = `Seat #${lastPart}`;
      }
    }

    const code = dto.ticketCode && dto.ticketCode.trim().length > 0
      ? dto.ticketCode
      : (dto.ticketNumber ?? `TCK-QR-${dto.id}`);

    const pass: TicketPass = {
      id: dto.ticketNumber ?? `TKN-${dto.id}`,
      ticketCode: code,
      seatNumber: seatNum,
    };

    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.passes.push(pass);
      existing.quantity = dto.bookingQuantity ?? existing.passes.length;
    } else {
      const dateObj = dto.bookingDate ? new Date(dto.bookingDate) : null;
      const formattedDate = dateObj
        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        : '—';
      const formattedTime = dateObj
        ? dateObj.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
        : '—';

      map.set(key, {
        groupKey: key,
        bookingId: dto.bookingId,
        movieTitle: dto.eventName || 'Cinema Screening',
        posterUrl: undefined,
        cinemaName: 'Hypercell Cinema',
        seatCategory: dto.seatCategoryName || 'STANDARD',
        bookingDate: formattedDate,
        showtime: formattedTime,
        quantity: dto.bookingQuantity ?? 1,
        totalPrice: dto.totalPrice ?? 0,
        status: dto.bookingStatus === 'CANCELLED'
          ? 'CANCELLED'
          : dto.bookingStatus === 'COMPLETED'
            ? 'COMPLETED'
            : dto.isBooked
              ? 'UPCOMING'
              : 'COMPLETED',
        passes: [pass],
      });
    }
  });

  return Array.from(map.values());
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
    QRCodeComponent,
  ],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.css',
})
export class MyTickets implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  // Raw tickets from API
  readonly rawTickets = signal<TicketDto[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccessBanner = signal<boolean>(false);
  readonly cancellingBookingId = signal<number | null>(null);
  readonly cancellationMessage = signal<string | null>(null);

  // Computed grouped bookings signal
  readonly groupedBookings = computed<GroupedBooking[]>(() =>
    groupTicketDtos(this.rawTickets())
  );

  // Computed active vs past grouped bookings
  readonly activeBookings = computed(() =>
    this.groupedBookings().filter((b) => b.status === 'UPCOMING')
  );
  readonly pastBookings = computed(() =>
    this.groupedBookings().filter((b) => b.status !== 'UPCOMING')
  );

  // Modal / Side Drawer state for digital passes viewer
  readonly selectedBookingForModal = signal<GroupedBooking | null>(null);
  readonly activePassIndex = signal<number>(0);

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
        this.rawTickets.set(dtos || []);
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

  // Digital Pass View Modal Controls
  openPassesModal(booking: GroupedBooking, initialIndex: number = 0): void {
    this.selectedBookingForModal.set(booking);
    this.activePassIndex.set(initialIndex);
  }

  closePassesModal(): void {
    this.selectedBookingForModal.set(null);
    this.activePassIndex.set(0);
  }

  nextPass(): void {
    const booking = this.selectedBookingForModal();
    if (!booking) return;
    if (this.activePassIndex() < booking.passes.length - 1) {
      this.activePassIndex.update((idx) => idx + 1);
    }
  }

  prevPass(): void {
    if (this.activePassIndex() > 0) {
      this.activePassIndex.update((idx) => idx - 1);
    }
  }

  selectPassIndex(index: number): void {
    this.activePassIndex.set(index);
  }

  cancelBooking(booking: GroupedBooking): void {
    if (!booking.bookingId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel booking?',
        message: `Are you sure you want to cancel your booking for ${booking.movieTitle}?`,
        confirmText: 'Cancel Booking',
        cancelText: 'Keep Booking',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed || !booking.bookingId) return;

      this.cancellingBookingId.set(booking.bookingId);
      this.cancellationMessage.set(null);
      this.errorMessage.set(null);

      this.ticketService.cancelBooking(booking.bookingId).subscribe({
        next: () => {
          this.cancellationMessage.set('Booking cancelled successfully.');
          this.cancellingBookingId.set(null);
          this.loadTickets();
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
