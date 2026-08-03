import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card';
import { MatChipsModule } from '@angular/material/chips';

export interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: string;
  rating: string;
  showtime: string;
  cinemaName: string;
  isPopular?: boolean;
}

export type MoviePlaceholder = Movie;

@Component({
  selector: 'app-discover',
  imports: [
    CommonModule,
    MovieCardComponent,
    MatChipsModule
  ],
  templateUrl: './discover.html',
  styleUrl: './discover.css',
})
export class Discover {

  readonly movies = signal<Movie[]>([
    {
      id: 1,
      title: 'Interstellar',
      genre: 'Science Fiction',
      duration: '2h 49m',
      rating: '8.7',
      showtime: 'Friday, 8:00 PM',
      cinemaName: 'Hypercell IMAX',
      isPopular: true,
    },
    {
    id: 2,
    title: 'Dune: Part Two',
    genre: 'Science Fiction',
    duration: '2h 46m',
    rating: '8.5',
    showtime: 'Saturday, 7:30 PM',
    cinemaName: 'Hypercell Cinema',
    isPopular: false,
    },
    {
    id: 3,
    title: 'The Sixth Sense',
    genre: 'Drama',
    duration: '2h 00m',
    rating: '8.5',
    showtime: 'Friday, 8 PM',
    cinemaName: 'Hypercell Cinema',
    isPopular: true,
    },
  ]);

  readonly genres = [
  'All',
  'Science Fiction',
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Cartoon',
];

readonly selectedGenre = signal<string>('All');

readonly filteredMovies = computed(() => {
  const selectedGenre = this.selectedGenre();

  if (selectedGenre === 'All') {
    return this.movies();
  }

  return this.movies().filter(
    (movie) => movie.genre === selectedGenre
  );
});

selectGenre(genre: string): void {
  this.selectedGenre.set(genre);
}

}
