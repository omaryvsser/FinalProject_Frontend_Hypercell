import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './booking-page.html',
  styleUrl: './booking-page.css',
})
export class BookingPage implements OnInit {
  private readonly bookingService = inject(BookingService);
  private router: Router | null = null;
  private route: ActivatedRoute | null = null;

  constructor() {
    try {
      this.router = inject(Router);
    } catch {
      this.router = null;
    }

    try {
      this.route = inject(ActivatedRoute);
    } catch {
      this.route = null;
    }
  }

  readonly ticketCount = signal<number>(1);
  readonly showtime = signal<string>('Friday, 8:00 PM');
  readonly customerName = signal<string>('');
  readonly customerEmail = signal<string>('');
  readonly customerPhone = signal<string>('');

  readonly nameTouched = signal<boolean>(false);
  readonly emailTouched = signal<boolean>(false);
  readonly phoneTouched = signal<boolean>(false);

  readonly bookingData = computed(() => {
    const current = this.bookingService.currentBooking();
    if (current) return current;
    return {
      movieId: 1,
      movieTitle: 'Interstellar: Beyond Time',
      cinemaName: 'Hypercell IMAX Cinema',
      ticketPrice: 150,
      selectedSeats: []
    };
  });

  readonly ticketPrice = computed(() => this.bookingData()?.ticketPrice || 150);
  readonly totalPrice = computed(() => this.ticketCount() * this.ticketPrice());

  readonly nameEmpty = computed(() => this.customerName().trim().length === 0);
  readonly emailInvalid = computed(() => {
    const email = this.customerEmail().trim();
    if (!email) return true;
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });
  readonly phoneInvalid = computed(() => this.customerPhone().trim().length < 8);

  readonly isFormValid = computed(() => {
    return !this.nameEmpty() && !this.emailInvalid() && !this.phoneInvalid() && this.ticketCount() > 0;
  });

  readonly availableShowtimes = [
    'Friday, 5:00 PM',
    'Friday, 8:00 PM',
    'Saturday, 6:00 PM',
    'Saturday, 9:00 PM'
  ];

  ngOnInit(): void {
    if (this.route) {
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        const movieId = Number(idParam);
        if (!this.bookingService.currentBooking()) {
          this.bookingService.initiateBooking({
            id: movieId,
            title: movieId === 2 ? 'Dune: Part Two' : movieId === 3 ? 'The Sixth Sense' : 'Interstellar: Beyond Time',
            showtime: 'Friday, 8:00 PM',
            cinemaName: 'Hypercell IMAX Cinema',
            price: 150
          });
        }
      }
    }
  }

  incrementTickets(): void {
    if (this.ticketCount() < 10) {
      this.ticketCount.update(count => count + 1);
    }
  }

  decrementTickets(): void {
    if (this.ticketCount() > 1) {
      this.ticketCount.update(count => count - 1);
    }
  }

  confirmBooking(): void {
    this.onSubmitBooking();
  }

  onSubmitBooking(): void {
    this.nameTouched.set(true);
    this.emailTouched.set(true);
    this.phoneTouched.set(true);

    if (!this.isFormValid()) return;

    const confirmed = this.bookingService.confirmBooking({
      customerName: this.customerName().trim(),
      customerEmail: this.customerEmail().trim(),
      customerPhone: this.customerPhone().trim(),
      showtime: this.showtime(),
      ticketCount: this.ticketCount()
    });

    if (confirmed && this.router) {
      this.router.navigate(['/booking-success']).then(() => {
        this.bookingService.clearCurrentBooking();
      });
    }
  }
}