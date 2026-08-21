import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminTableComponent, TableColumn } from '../../../../shared/components/admin-table/admin-table';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface AttendeeBooking {
  bookingId: number;
  customerName: string;
  customerEmail: string;
  seatCategory: string;
  quantity: number;
  totalPrice: number;
  status: BookingStatus;
  bookedAt: string;
}

interface MovieBookingData {
  movieTitle: string;
  bookings: AttendeeBooking[];
}

const TEMPORARY_BOOKINGS: Record<number, MovieBookingData> = {
  1: {
    movieTitle: 'Interstellar',
    bookings: [
      {
        bookingId: 1001,
        customerName: 'Omar Hassan',
        customerEmail: 'omar@example.com',
        seatCategory: 'VIP',
        quantity: 2,
        totalPrice: 1000,
        status: 'CONFIRMED',
        bookedAt: '2026-08-05T14:20:00',
      },
      {
        bookingId: 1002,
        customerName: 'Mariam Ali',
        customerEmail: 'mariam@example.com',
        seatCategory: 'STANDARD',
        quantity: 1,
        totalPrice: 150,
        status: 'PENDING',
        bookedAt: '2026-08-05T16:45:00',
      },
    ],
  },
  2: {
    movieTitle: 'Dune: Part Two',
    bookings: [],
  },
};

@Component({
  selector: 'app-attendees',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    AdminTableComponent,
  ],
  templateUrl: './attendees.html',
  styleUrl: './attendees.css',
})

export class Attendees implements OnInit {
  private route: ActivatedRoute | null = null;

  constructor() {
    try {
      this.route = inject(ActivatedRoute);
    } catch {
      this.route = null;
    }
  }

  readonly movieId = signal<number | null>(null);
  readonly movieTitle = signal<string>('Selected Movie');
  readonly bookings = signal<AttendeeBooking[]>([]);

  readonly tableColumns: TableColumn<AttendeeBooking>[] = [
    { key: 'bookingId', header: 'Booking', format: (val) => `#${val}` },
    { key: 'customerName', header: 'Attendee', type: 'attendee' },
    { key: 'seatCategory', header: 'Seat' },
    { key: 'quantity', header: 'Tickets' },
    { key: 'totalPrice', header: 'Total', type: 'currency' },
    { key: 'status', header: 'Status', type: 'bookingStatus' },
    { key: 'bookedAt', header: 'Booked At', type: 'date' },
  ];


  readonly totalBookings = computed(
    () => this.bookings().length
  );

  readonly totalTickets = computed(
    () =>
      this.bookings().reduce(
        (total, booking) => total + booking.quantity,
        0
      )
  );

  readonly totalRevenue = computed(
    () =>
      this.bookings().reduce(
        (total, booking) => total + booking.totalPrice,
        0
      )
  );

  ngOnInit(): void {
    const idParameter = this.route?.snapshot.paramMap.get('id') ?? null;

    if (idParameter === null) {
      return;
    }

    const parsedId = Number(idParameter);

    if (!Number.isNaN(parsedId)) {
      this.movieId.set(parsedId);
      this.loadTemporaryBookings(parsedId);
    }
  }

  private loadTemporaryBookings(movieId: number): void {
    const movieBookingData = TEMPORARY_BOOKINGS[movieId];

    if (!movieBookingData) {
      return;
    }

    this.movieTitle.set(movieBookingData.movieTitle);
    this.bookings.set(movieBookingData.bookings);
  }
}
