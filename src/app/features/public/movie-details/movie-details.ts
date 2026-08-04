import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

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

const MOVIES_DATABASE: Record<number, Movie> = {
  1: {
    id: 1,
    title: 'Interstellar: Beyond Time',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    synopsis:
      'When Earth becomes uninhabitable, a team of ex-NASA pilots and researchers undertakes a perilous voyage through a wormhole near Saturn to discover a new home for humanity, braving extreme gravitational physics, time dilation, and the unknown depths of deep space.',
    runtime: '2h 49m',
    rating: '8.7',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    director: 'Christopher Nolan',
    releaseYear: 2014,
    ageRating: 'PG-13',
    language: 'English (IMAX 3D)',
  },
  2: {
    id: 2,
    title: 'Dune: Part Two',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    synopsis:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
    runtime: '2h 46m',
    rating: '8.5',
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    director: 'Denis Villeneuve',
    releaseYear: 2024,
    ageRating: 'PG-13',
    language: 'English (Dolby Atmos)',
  },
  3: {
    id: 3,
    title: 'The Sixth Sense',
    backdropUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=1920&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
    synopsis:
      'A child psychologist starts treating a young boy who communicates with spirits that do not know they are dead, uncovering a haunting mystery that alters their lives forever.',
    runtime: '2h 00m',
    rating: '8.5',
    genres: ['Drama', 'Mystery', 'Thriller'],
    director: 'M. Night Shyamalan',
    releaseYear: 1999,
    ageRating: 'PG-13',
    language: 'English (4K Digital)',
  },
};

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './movie-details.html',
  styleUrl: './movie-details.css',
})
export class MovieDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);

  // Movie signal containing data
  readonly movie = signal<Movie>(MOVIES_DATABASE[1]);

  // Available date options signal
  readonly dates = signal<DateOption[]>([
    { id: '2026-08-04', dayLabel: 'TODAY', dateNumber: '04', month: 'AUG' },
    { id: '2026-08-05', dayLabel: 'WED', dateNumber: '05', month: 'AUG' },
    { id: '2026-08-06', dayLabel: 'THU', dateNumber: '06', month: 'AUG' },
    { id: '2026-08-07', dayLabel: 'FRI', dateNumber: '07', month: 'AUG' },
  ]);

  // Selected date signal
  readonly selectedDate = signal<string>('2026-08-04');

  // Computed signal deriving the selected DateOption object
  readonly selectedDateOption = computed(() =>
    this.dates().find((d) => d.id === this.selectedDate())
  );

  // Venues signal containing dummy data
  readonly venues = signal<Venue[]>([
    {
      name: 'Hypercell IMAX Cinema',
      address: '123 Tech Boulevard, Innovation District',
      screenType: 'IMAX 3D Laser',
      showtimes: ['14:30', '18:00', '21:00', '23:30'],
    },
    {
      name: 'Grand Cineplex Atmos',
      address: '45 Downtown Plaza, Avenue 5',
      screenType: 'Dolby Cinema',
      showtimes: ['13:15', '16:45', '19:30', '22:15'],
    },
    {
      name: 'Starlight Premier Cinema',
      address: '88 Horizon Way, Westside Complex',
      screenType: 'VIP Luxe Screen',
      showtimes: ['15:00', '18:30', '21:45'],
    },
  ]);

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
        const id = Number(idParam);
        if (MOVIES_DATABASE[id]) {
          this.movie.set(MOVIES_DATABASE[id]);
        }
      }
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
