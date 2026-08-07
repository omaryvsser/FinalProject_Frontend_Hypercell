import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

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

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    MovieCardComponent,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './discover.html',
  styleUrl: './discover.css',
})
export class Discover {
  readonly searchQuery = signal<string>('');
  readonly selectedGenre = signal<string>('All');

  readonly movies = signal<Movie[]>([
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
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
      isPopular: true,
    },
    {
      id: 4,
      title: 'The Blue Elephant 2',
      genre: 'Horror / Mystery',
      duration: '2h 10m',
      rating: '8.2',
      showtime: 'Saturday, 9:00 PM',
      cinemaName: 'Zawya Cinema Downtown',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
      isPopular: true,
    },
    {
      id: 5,
      title: 'Voy! Voy! Voy!',
      genre: 'Comedy / Drama',
      duration: '1h 55m',
      rating: '8.0',
      showtime: 'Sunday, 6:00 PM',
      cinemaName: 'San Stefano Grand Cinema',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
      isPopular: false,
    },
  ]);

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
    const query = this.searchQuery().toLowerCase().trim();

    return this.movies().filter((movie) => {
      const matchesGenre = genre === 'All' || movie.genre.toLowerCase().includes(genre.toLowerCase());
      const matchesSearch = !query || movie.title.toLowerCase().includes(query) || movie.cinemaName.toLowerCase().includes(query);
      return matchesGenre && matchesSearch;
    });
  });

  selectGenre(genre: string): void {
    this.selectedGenre.set(genre);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }
}
