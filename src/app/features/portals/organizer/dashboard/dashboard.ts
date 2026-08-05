import { CommonModule } from '@angular/common';
import { Component, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

interface OrganizerMovie {
  id: number;
  title: string;
  category: string;
  startDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  venueName: string;
  bookings: number;
  attendees: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly organizerMovies = signal<OrganizerMovie[]>([
    {
      id: 1,
      title: 'Interstellar',
      category: 'Science Fiction',
      startDate: '2026-08-14T20:00:00',
      status: 'PUBLISHED',
      venueName: 'Hypercell IMAX',
      bookings: 32,
      attendees: 58,
    },
    {
      id: 2,
      title: 'Dune: Part Two',
      category: 'Science Fiction',
      startDate: '2026-08-20T19:30:00',
      status: 'DRAFT',
      venueName: 'Hypercell Cinema',
      bookings: 0,
      attendees: 0,
    },
  ]);
  readonly totalMovies = computed(
    () => this.organizerMovies().length
  );

  readonly publishedMovies = computed(
    () =>
      this.organizerMovies().filter(
        (movie) => movie.status === 'PUBLISHED'
      ).length
  );

  readonly totalBookings = computed(
    () =>
      this.organizerMovies().reduce(
        (total, movie) => total + movie.bookings,
        0
      )
  );

  readonly totalAttendees = computed(
    () =>
      this.organizerMovies().reduce(
        (total, movie) => total + movie.attendees,
        0
      )
  );
}
