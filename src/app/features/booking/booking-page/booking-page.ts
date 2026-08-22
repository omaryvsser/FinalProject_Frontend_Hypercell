import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { form, required, email, minLength, FormField, FormRoot } from '@angular/forms/signals';
import { BookingService } from '../../../core/services/booking.service';
import { EventService } from '../../../core/services/event.service';
import { SeatService } from '../../../core/services/seat.service';
import { AuthService } from '../../../core/services/auth.service';
import { SeatCategoryResponse } from '../../../core/models/event.model';
import { BookingCreateRequest } from '../../../core/models/booking.model';
import { Seat } from '../../../core/models/seat.model';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

export const MAX_TICKETS_PER_BOOKING = 8;

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormField,
    FormRoot,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './booking-page.html',
  styleUrl: './booking-page.css',
})
export class BookingPage implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly eventService = inject(EventService);
  private readonly seatService = inject(SeatService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- Event Details Signals ---
  readonly eventId = signal<number>(1);
  readonly movieTitle = signal<string>('Cinema Event');
  readonly cinemaName = signal<string>('Hypercell Cinema');
  readonly movieCategory = signal<string>('Cinema');
  readonly runtime = signal<string>('');
  readonly showtime = signal<string>('Tonight, 8:00 PM');
  readonly isLoadingDetails = signal<boolean>(false);

  // --- Seat Map Signals ---
  readonly seats = signal<Seat[]>([]);
  readonly selectedSeats = signal<Seat[]>([]);
  readonly seatCategories = signal<SeatCategoryResponse[]>([]);
  readonly isLoadingSeats = signal<boolean>(false);
  readonly seatFetchError = signal<string | null>(null);

  // --- Derived Layout Signals ---
  readonly rows = computed(() => {
    const rowSet = new Set<string>();
    for (const seat of this.seats()) {
      if (seat.row) rowSet.add(seat.row);
    }
    return Array.from(rowSet).sort();
  });

  readonly seatsByRow = computed(() => {
    const map: Record<string, Seat[]> = {};
    for (const seat of this.seats()) {
      const r = seat.row || 'A';
      if (!map[r]) map[r] = [];
      map[r].push(seat);
    }
    for (const r in map) {
      map[r].sort((a, b) => a.number - b.number);
    }
    return map;
  });

  readonly selectedSeatIds = computed(() => new Set(this.selectedSeats().map((s) => s.id)));

  readonly quantity = computed(() => this.selectedSeats().length);

  readonly totalPrice = computed(() =>
    this.selectedSeats().reduce((sum, seat) => sum + (seat.price || 0), 0)
  );

  readonly availableCount = computed(
    () => this.seats().filter((s) => s.status === 'AVAILABLE').length
  );

  readonly bookedCount = computed(
    () => this.seats().filter((s) => s.status === 'BOOKED').length
  );

  // --- Customer Signal Form Model & Schema ---
  readonly customerModel = signal({
    name: '',
    email: '',
    phone: '',
  });

  readonly customerForm = form(
    this.customerModel,
    (schema) => {
      required(schema.name, { message: 'Name is required' });
      required(schema.email, { message: 'Email is required' });
      email(schema.email, { message: 'Please enter a valid email' });
      required(schema.phone, { message: 'Phone number is required' });
      minLength(schema.phone, 8, { message: 'Enter a valid phone number' });
    },
    {
      submission: {
        action: async () => {
          this.onSubmitBooking();
        },
      },
    }
  );

  readonly isSubmitting = signal<boolean>(false);
  readonly bookingError = signal<string | null>(null);
  readonly seatLimitWarning = signal<string | null>(null);

  readonly isFormValid = computed(() => {
    return (
      this.selectedSeats().length >= 1 &&
      this.selectedSeats().length <= MAX_TICKETS_PER_BOOKING &&
      this.customerForm().valid()
    );
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.customerModel.update((m) => ({
        ...m,
        name: user.name || m.name,
        email: user.email || m.email,
      }));
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = idParam ? Number(idParam) : 1;
    this.eventId.set(parsedId);

    this.loadEventDetails(parsedId);
    this.loadSeats(parsedId);
  }

  loadEventDetails(id: number): void {
    this.isLoadingDetails.set(true);
    this.eventService.getEventDetails(id).subscribe({
      next: (details: any) => {
        this.isLoadingDetails.set(false);
        if (details) {
          this.movieTitle.set(details.title || 'Cinema Event');
          this.cinemaName.set(details.venueName || 'Hypercell Cinema');
          this.movieCategory.set(details.category || 'Movie');
          if (details.durationMinutes) {
            this.runtime.set(`${details.durationMinutes} mins`);
          }
          if (details.startDate) {
            const d = new Date(details.startDate);
            this.showtime.set(
              d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                ' • ' +
                d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            );
          }

          if (details.seatCategories && details.seatCategories.length > 0) {
            const formattedCategories: SeatCategoryResponse[] = details.seatCategories.map(
              (cat: any) => ({
                id: cat.id,
                categoryName: cat.categoryName || cat.name,
                price: Number(cat.price),
                availableSeats: cat.availableSeats ?? cat.totalSeats,
              })
            );
            this.seatCategories.set(formattedCategories);
          }
        }
      },
      error: (err) => {
        this.isLoadingDetails.set(false);
        console.error('Failed to load event details:', err);
      },
    });
  }

  loadSeats(id: number): void {
    this.isLoadingSeats.set(true);
    this.seatFetchError.set(null);

    this.seatService.getEventSeats(id).subscribe({
      next: (seatList) => {
        this.isLoadingSeats.set(false);
        this.seats.set(seatList || []);

        // Filter out any previously selected seats that became booked
        const updatedSelected = this.selectedSeats().filter((sel) => {
          const fresh = seatList.find((s) => s.id === sel.id);
          return fresh && fresh.status !== 'BOOKED';
        });

        if (updatedSelected.length !== this.selectedSeats().length) {
          this.selectedSeats.set(updatedSelected);
          this.bookingError.set(
            'One or more of your previously selected seats became unavailable and were removed.'
          );
        }
      },
      error: (err) => {
        this.isLoadingSeats.set(false);
        this.seatFetchError.set('Could not load cinema seats layout. Please try again.');
        console.error('Failed to load seats:', err);
      },
    });
  }

  isSeatSelected(seatId: number): boolean {
    return this.selectedSeatIds().has(seatId);
  }

  toggleSeat(seat: Seat): void {
    if (seat.status === 'BOOKED' || this.isSubmitting()) {
      return;
    }

    this.seatLimitWarning.set(null);
    this.bookingError.set(null);

    if (this.isSeatSelected(seat.id)) {
      this.selectedSeats.update((list) => list.filter((s) => s.id !== seat.id));
    } else {
      if (this.selectedSeats().length >= MAX_TICKETS_PER_BOOKING) {
        this.seatLimitWarning.set(
          `Maximum ${MAX_TICKETS_PER_BOOKING} seats allowed per booking reservation.`
        );
        return;
      }
      this.selectedSeats.update((list) => [...list, seat]);
    }
  }

  removeSeat(seat: Seat): void {
    this.selectedSeats.update((list) => list.filter((s) => s.id !== seat.id));
    this.seatLimitWarning.set(null);
  }

  clearSelection(): void {
    this.selectedSeats.set([]);
    this.seatLimitWarning.set(null);
  }

  confirmBooking(): void {
    this.onSubmitBooking();
  }

  onSubmitBooking(): void {
    if (this.isSubmitting()) return;

    this.customerForm().markAsTouched();

    if (this.selectedSeats().length < 1) {
      this.bookingError.set('Please select at least 1 cinema seat to proceed.');
      return;
    }

    if (this.selectedSeats().length > MAX_TICKETS_PER_BOOKING) {
      this.bookingError.set(
        `Maximum ${MAX_TICKETS_PER_BOOKING} seats allowed per booking reservation.`
      );
      return;
    }

    if (!this.isFormValid()) {
      return;
    }

    const selectedList = this.selectedSeats();
    const primarySeatCategoryId =
      selectedList[0]?.seatCategoryId ||
      this.seatCategories()[0]?.id ||
      1;

    const userId = this.authService.getUserIdFromToken() || 1;

    const payload: BookingCreateRequest = {
      eventId: this.eventId(),
      userId,
      seatCategoryId: primarySeatCategoryId,
      quantity: selectedList.length,
      seatIds: selectedList.map((s) => s.id),
    };

    this.isSubmitting.set(true);
    this.bookingError.set(null);

    this.bookingService.createBooking(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);

        // Reset local selection
        this.selectedSeats.set([]);

        // Navigate to My Tickets page with success notification
        this.router.navigate(['/my-tickets'], {
          queryParams: { confirmed: 'true', bookingId: res?.bookingId },
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);

        const rawMsg =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err?.error?.errors?.quantity ||
          'Booking failed. Please try again.';

        if (
          rawMsg.toLowerCase().includes('no longer available') ||
          rawMsg.toLowerCase().includes('already booked') ||
          rawMsg.toLowerCase().includes('conflict')
        ) {
          this.bookingError.set(
            'One or more selected seats are no longer available. Please choose different seats.'
          );
        } else {
          this.bookingError.set(rawMsg);
        }

        // Auto-refresh seat map to update newly booked seats
        this.loadSeats(this.eventId());
      },
    });
  }
}
