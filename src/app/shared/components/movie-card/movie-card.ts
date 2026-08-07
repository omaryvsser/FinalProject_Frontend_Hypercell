import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Movie } from '../../../features/public/discover/discover';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css',
})
export class MovieCardComponent {
  @Input({ required: true })
  movie!: Movie;

  readonly hasImageError = signal<boolean>(false);

  onImageError(): void {
    this.hasImageError.set(true);
  }
}

export { MovieCardComponent as MovieCard };
