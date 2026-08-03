import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card';

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
  ]);

}
