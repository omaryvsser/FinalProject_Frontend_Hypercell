import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
export class BookingPage {
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);

  readonly ticketCount = signal<number>(1);
  readonly showtime = signal<string>('Friday, 8:00 PM');
  readonly customerName = signal<string>('');
  readonly customerEmail = signal<string>('');
  readonly customerPhone = signal<string>('');

  readonly nameTouched = signal<boolean>(false);
  readonly emailTouched = signal<boolean>(false);
  readonly phoneTouched = signal<boolean>(false);

  readonly bookingData = this.bookingService.currentBooking;

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

  if (confirmed) {
    // التوجيه المباشر لصفحة التذاكر بعد تأكيد الحجز
    this.router.navigate(['/my-tickets']).then(() => {
      this.bookingService.clearCurrentBooking();
    });
  }
  }}