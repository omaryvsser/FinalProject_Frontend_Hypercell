import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../../../core/services/booking.service';

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

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.css',
})
export class MyTickets {
  private readonly bookingService = inject(BookingService);

  private mockTicketsSignal = signal<Ticket[]>([
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
  ]);

  readonly tickets = computed<Ticket[]>(() => {
    const userBookings = this.bookingService.myBookings();
    if (userBookings && userBookings.length > 0) {
      const dynamicTickets: Ticket[] = userBookings.map((b) => ({
        id: b.id || 'TICK-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        movieTitle: b.movieTitle || 'Movie Ticket',
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
        cinemaName: b.cinemaName || 'Cinema Venue',
        seatCategory: 'VIP Premium',
        seatNumber: `${b.ticketCount || 1} Reserved Pass(es)`,
        bookingDate: b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'Aug 07, 2026',
        showtime: b.showtime || '8:00 PM',
        price: b.totalPrice || (b.ticketPrice || 150) * (b.ticketCount || 1),
        status: 'UPCOMING' as const,
      }));
      return [...dynamicTickets, ...this.mockTicketsSignal()];
    }
    return this.mockTicketsSignal();
  });
}
