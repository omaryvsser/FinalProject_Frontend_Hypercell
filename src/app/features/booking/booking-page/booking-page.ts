import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { form, required, email, minLength, FormField, FormRoot } from '@angular/forms/signals';
import { BookingService } from '../../../core/services/booking.service';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { SeatCategoryResponse } from '../../../core/models/event.model';
import { BookingCreateRequest } from '../../../core/models/booking.model';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const DEFAULT_CATEGORIES: SeatCategoryResponse[] = [
  { id: 1, categoryName: 'STANDARD', price: 120, availableSeats: 50 },
  { id: 2, categoryName: 'VIP', price: 200, availableSeats: 25 },
  { id: 3, categoryName: 'IMAX', price: 280, availableSeats: 15 },
];

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    FormRoot,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  templateUrl: './booking-page.html',
  styleUrl: './booking-page.css',
})
export class BookingPage implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- Event Details Signals ---
  readonly eventId = signal<number>(1);
  readonly movieTitle = signal<string>('Cinema Event');
  readonly cinemaName = signal<string>('Hypercell Cinema');
  readonly isLoadingDetails = signal<boolean>(false);

  // --- Seat Categories & Selection Signals ---
  readonly seatCategories = signal<SeatCategoryResponse[]>([]);
  readonly selectedCategory = signal<SeatCategoryResponse | null>(null);
  readonly quantity = signal<number>(1);
  readonly totalPrice = computed(() => (this.selectedCategory()?.price || 0) * this.quantity());

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

  readonly isFormValid = computed(() => {
    return (
      this.selectedCategory() !== null &&
      this.customerForm().valid() &&
      this.quantity() > 0
    );
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.customerModel.update(m => ({
        ...m,
        name: user.name || m.name,
        email: user.email || m.email,
      }));
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = idParam ? Number(idParam) : 1;
    this.eventId.set(parsedId);

    this.loadEventDetails(parsedId);
  }


  private loadEventDetails(id: number): void {
    this.isLoadingDetails.set(true);
    this.eventService.getEventDetails(id).subscribe({
      next: (details: any) => {
        this.isLoadingDetails.set(false);
        if (details) {
          this.movieTitle.set(details.title || 'Cinema Event');
          this.cinemaName.set(details.venueName || 'Hypercell Cinema');

          // Check if categories exist on the response
          if (details.seatCategories && details.seatCategories.length > 0) {
            const formattedCategories: SeatCategoryResponse[] = details.seatCategories.map((cat: any) => ({
              id: cat.id,
              // Handle both 'categoryName' and 'name' properties safely
              categoryName: cat.categoryName || cat.name,
              price: Number(cat.price),
              availableSeats: cat.availableSeats ?? cat.totalSeats
            }));

            this.seatCategories.set(formattedCategories);
            this.selectedCategory.set(formattedCategories[0]);
          } else {
            console.warn('Backend returned no seat categories for event #' + id);
          }
        }
      },
      error: (err) => {
        this.isLoadingDetails.set(false);
        console.error('Failed to load event details:', err);
      }
    });
  }

  selectCategory(category: SeatCategoryResponse): void {
    this.selectedCategory.set(category);
    if (this.quantity() > category.availableSeats) {
      this.quantity.set(Math.max(1, category.availableSeats));
    }
  }

  incrementQuantity(): void {
    const maxAvailable = this.selectedCategory()?.availableSeats ?? 10;
    if (this.quantity() < maxAvailable) {
      this.quantity.update((count) => count + 1);
    }
  }

  decrementQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update((count) => count - 1);
    }
  }

  confirmBooking(): void {
    this.onSubmitBooking();
  }

  onSubmitBooking(): void {
    if (this.isSubmitting()) return;

    this.customerForm().markAsTouched();

    if (!this.isFormValid()) {
      return;
    }

    const selectedCat = this.selectedCategory();
    if (!selectedCat) return;

    const userId = this.authService.getUserIdFromToken() || 1;

    const payload: BookingCreateRequest = {
      eventId: this.eventId(),
      userId,
      seatCategoryId: selectedCat.id,
      quantity: this.quantity()
    };

    this.isSubmitting.set(true);
    this.bookingError.set(null);

    this.bookingService.createBooking(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);

        //  1. Optimistic UI Update (Instant Feedback)
        const bookedQty = this.quantity();
        const targetCatId = selectedCat.id;

        this.seatCategories.update((categories) =>
          categories.map((cat) =>
            cat.id === targetCatId
              ? { ...cat, availableSeats: Math.max(0, cat.availableSeats - bookedQty) }
              : cat
          )
        );

        if (this.selectedCategory()?.id === targetCatId) {
          this.selectedCategory.update((cat) =>
            cat ? { ...cat, availableSeats: Math.max(0, cat.availableSeats - bookedQty) } : null
          );
        }

        //  2. Absolute Truth Re-fetch (Concurrency & DB Sync)
        this.loadEventDetails(this.eventId());

        //  3. Form Reset
        this.quantity.set(1);

        //  4. Clean Navigation to My Tickets page
        this.router.navigate(['/my-tickets'], {
          queryParams: { confirmed: 'true', bookingId: res?.bookingId }
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || (typeof err?.error === 'string' ? err.error : 'Booking failed. Please try again.');
        this.bookingError.set(msg);
      }
    });
  }
}

