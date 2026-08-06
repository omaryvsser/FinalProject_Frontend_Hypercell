import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingDetails } from '../../../core/services/booking.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-booking-success',
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './booking-success.html',
  styleUrl: './booking-success.css',
})
export class BookingSuccess {
  readonly booking: BookingDetails | null = null;

  constructor(private router: Router) {
    // استقبال التذكرة المؤكدة الممررة عبر الـ Navigation State
    const nav = this.router.getCurrentNavigation();
    this.booking = nav?.extras?.state?.['booking'] || null;
  }
}