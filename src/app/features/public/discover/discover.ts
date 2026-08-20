import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventService } from '../../../core/services/event.service';
import { eventToMovie } from '../../../core/models/movie.model';

export interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: string;
  rating: string;
  showtime: string;
  cinemaName: string;
  imageUrl?: string;
  posterUrl?: string;
  isPopular?: boolean;
}

export type MoviePlaceholder = Movie;

/** Fallback movies shown while the API loads or if it fails */
const FALLBACK_MOVIES: Movie[] = [
  {
    id: 1,
    title: 'Interstellar: Beyond Time',
    genre: 'Science Fiction',
    duration: '2h 49m',
    rating: '8.7',
    showtime: 'Friday, 8:00 PM',
    cinemaName: 'Vox Cinema Mall of Egypt',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
  },
  {
    id: 2,
    title: 'Dune: Part Two',
    genre: 'Science Fiction',
    duration: '2h 46m',
    rating: '8.5',
    showtime: 'Saturday, 7:30 PM',
    cinemaName: 'Sea Cinema El Gouna',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
  },
  {
    id: 3,
    title: 'The Sixth Sense',
    genre: 'Drama',
    duration: '2h 00m',
    rating: '8.5',
    showtime: 'Friday, 8:00 PM',
    cinemaName: 'Cairo Opera House Main Hall',
    imageUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=600&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
  },
  {
    id: 4,
    title: 'Whiplash',
    genre: 'Drama / Music',
    duration: '1h 47m',
    rating: '8.5',
    showtime: 'Saturday, 9:00 PM',
    cinemaName: 'Zamalek Cinema',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
  },
  {
    id: 5,
    title: 'The Grand Budapest Hotel',
    genre: 'Comedy / Drama',
    duration: '1h 55m',
    rating: '8.0',
    showtime: 'Sunday, 6:00 PM',
    cinemaName: 'San Stefano Grand Cinema',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
  },
];

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MovieCardComponent,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './discover.html',
  styleUrl: './discover.css',
})
export class Discover implements OnInit {
  private readonly eventService = inject(EventService);

  // Search & filter Signal Forms state
  readonly searchModel = signal({
    query: '',
  });

  readonly searchForm = form(this.searchModel);

  readonly selectedGenre = signal<string>('All');

  // Data & UI state signals
  readonly movies = signal<Movie[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly genres = [
    'All',
    'Science Fiction',
    'Action',
    'Comedy',
    'Drama',
    'Horror',
  ];

  readonly filteredMovies = computed(() => {
    const genre = this.selectedGenre();
    const query = this.searchModel().query.toLowerCase().trim();

    return this.movies().filter((movie) => {
      const matchesGenre =
        genre === 'All' || movie.genre.toLowerCase().includes(genre.toLowerCase());
      const matchesSearch =
        !query ||
        movie.title.toLowerCase().includes(query) ||
        movie.cinemaName.toLowerCase().includes(query);
      return matchesGenre && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.eventService.getPublicEvents(0, 100).subscribe({
      next: (page: any) => {
        const apiMovies = (page?.content || page || []).map((event: any) => {
          const mapped = eventToMovie(event);

          //  Extract image directly from backend response OR mapped object
          const image = event.imageUrl || mapped?.imageUrl || mapped?.posterUrl;

          return {
            ...mapped,
            imageUrl: image,
            posterUrl: image, // Ensure posterUrl is populated for MovieCardComponent
            duration: mapped?.duration || '2h 00m',
            rating: mapped?.rating || '8.5',
          } as Movie;
        });

        this.movies.set(apiMovies);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load movies:', err);
        this.isLoading.set(false);
        this.errorMessage.set('Failed to load movies from server.');
      }
    });
  }

  selectGenre(genre: string): void {
    this.selectedGenre.set(genre);
  }

  clearSearch(): void {
    this.searchModel.set({ query: '' });
  }
}

