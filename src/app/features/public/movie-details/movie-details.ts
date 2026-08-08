import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';

export interface Movie {
  id?: number;
  title: string;
  backdropUrl: string;
  posterUrl: string;
  synopsis: string;
  runtime: string;
  rating: string;
  genres: string[];
  director?: string;
  releaseYear?: number;
  ageRating?: string;
  language?: string;
}

export interface Venue {
  name: string;
  address: string;
  showtimes: string[];
  screenType?: string;
}

export interface DateOption {
  id: string;
  dayLabel: string;
  dateNumber: string;
  month: string;
}

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './movie-details.html',
  styleUrl: './movie-details.css',
})
export class MovieDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  // UI State Signals
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Movie details signal
  readonly movie = signal<Movie | null>(null);

  // Available date options signal
  readonly dates = signal<DateOption[]>([
    { id: '2026-08-08', dayLabel: 'TODAY', dateNumber: '08', month: 'AUG' },
    { id: '2026-08-09', dayLabel: 'SUN', dateNumber: '09', month: 'AUG' },
    { id: '2026-08-10', dayLabel: 'MON', dateNumber: '10', month: 'AUG' },
    { id: '2026-08-11', dayLabel: 'TUE', dateNumber: '11', month: 'AUG' },
  ]);

  // Selected date signal
  readonly selectedDate = signal<string>('2026-08-08');

  // Computed signal deriving the selected DateOption object
  readonly selectedDateOption = computed(() =>
    this.dates().find((d) => d.id === this.selectedDate())
  );

  // Venues signal containing dynamic data from backend
  readonly venues = signal<Venue[]>([]);

  // Computed total available showtimes across all venues
  readonly totalShowtimesCount = computed(() =>
    this.venues().reduce((acc, v) => acc + v.showtimes.length, 0)
  );

  // Selected showtime tracking (venueName + showtime)
  readonly selectedShowtime = signal<{ venueName: string; time: string } | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.fetchEventDetails(Number(idParam));
      }
    });
  }

  fetchEventDetails(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.eventService.getEventDetails(id).subscribe({
      next: (eventData: any) => {
        console.log('🎬 Backend Event Details:', eventData);

        // 1. Format dates from event start time if available
        const startDate = eventData.startDate ? new Date(eventData.startDate) : new Date();
        const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 2. Map Backend Response to Movie Signal Model
        const defaultImage = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1920&auto=format&fit=crop';

        this.movie.set({
          id: eventData.id,
          title: eventData.title,
          backdropUrl: eventData.imageUrl || defaultImage,
          posterUrl: eventData.imageUrl || defaultImage,
          synopsis: eventData.description || 'No synopsis provided for this event.',
          runtime: '2h 15m', // Standard display placeholder
          rating: '8.0',
          genres: eventData.category ? [eventData.category] : ['Historical'],
          director: 'Organizer Special',
          releaseYear: startDate.getFullYear(),
          ageRating: 'PG-13',
          language: 'English / Arabic Subtitles',
        });

        // 3. Map Venue Data returned from Backend
        this.venues.set([
          {
            name: eventData.venueName || 'Main Cinema Venue',
            address: eventData.venueAddress || '123 Entertainment Hub',
            screenType: 'Standard Digital',
            showtimes: [formattedTime, '18:00', '21:00'],
          },
        ]);

        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Failed to load event details:', err);
        this.isLoading.set(false);
        this.errorMessage.set('Could not load movie details from server.');
      },
    });
  }

  selectDate(dateId: string): void {
    this.selectedDate.set(dateId);
  }

  selectShowtime(venueName: string, time: string): void {
    this.selectedShowtime.set({ venueName, time });
  }
}

// Export alias for backward compatibility with existing imports
export { MovieDetailsComponent as MovieDetails };
